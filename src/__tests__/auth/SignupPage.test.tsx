import React from "react";
import { screen, fireEvent, waitFor } from "../../test-utils";
import { renderWithProviders } from "../../test-utils";
import SignupPage from "../../app/(auth)/signup/page";

const pushMock = jest.fn();
const replaceMock = jest.fn();
const mockSignIn = jest.fn();

// I’m mirroring the login test setup so both auth screens share the same
// assumptions about routing and session state in tests.
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
      replace: replaceMock,
    }),
    useSearchParams: () => ({
      get: (key: string) => {
        // Same story as the login tests: I don’t care which key is requested,
        // I just want a predictable null return without lint noise.
        void key;
        return null;
      },
    }),
  };
});

jest.mock("next-auth/react", () => {
  const actual = jest.requireActual("next-auth/react");
  return {
    ...actual,
    signIn: (...args: unknown[]) => mockSignIn(...args),
    useSession: () => ({ data: null, status: "unauthenticated" as const }),
  };
});

type GlobalWithFetch = typeof globalThis & { fetch: jest.Mock };

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  mockSignIn.mockReset();

  // I’m stubbing fetch so the signup flow can pretend the backend exists
  // without dragging a real API into the test run.
  (global as GlobalWithFetch).fetch = jest.fn();
});

test("shows a validation error when required fields are missing", async () => {
  renderWithProviders(<SignupPage />);

  const submit = screen.getByRole("button", { name: /sign up/i });
  fireEvent.click(submit);

  await waitFor(() => {
    expect(
      screen.getByText(/please fill in all fields/i)
    ).toBeInTheDocument();
  });

  expect((global as GlobalWithFetch).fetch).not.toHaveBeenCalled();
  expect(mockSignIn).not.toHaveBeenCalled();
});

test("calls signup endpoint and then attempts sign-in on success", async () => {
  (global as GlobalWithFetch).fetch.mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response);

  mockSignIn.mockResolvedValue({ error: null, url: "/dashboard" });

  renderWithProviders(<SignupPage />);

  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: "Will Tester" },
  });
  // MUI appends an asterisk to required labels ("Email *"), so I’m using a
  // relaxed match here instead of an over-strict regex that breaks on styling.
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "will@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "super-secret" },
  });

  const submit = screen.getByRole("button", { name: /sign up/i });
  fireEvent.click(submit);

  // The goal here is to prove the happy path: we hit the signup endpoint first,
  // then hand off to the same credentials flow used by login.
  await waitFor(() => {
    expect((global as GlobalWithFetch).fetch).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(mockSignIn).toHaveBeenCalled();
  });
});