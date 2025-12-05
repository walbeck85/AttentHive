import React from "react";
import { screen, fireEvent, waitFor } from "../../test-utils";
import { renderWithProviders } from "../../test-utils";
import LoginPage from "../../app/(auth)/login/page";

const pushMock = jest.fn();
const replaceMock = jest.fn();
const mockSignIn = jest.fn();

// I’m stubbing out navigation and auth hooks here so the tests can focus on
// how the page reacts to different states instead of booting the whole app.
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
        // I’m explicitly ignoring the key but still “using” it so ESLint
        // doesn’t yell at us; for now we just want a stable return shape.
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
    // I don’t need tight typing here, I just want a predictable seam I can spy on
    // without pulling next-auth into the test runtime.
    signIn: (...args: unknown[]) => mockSignIn(...args),
    useSession: () => ({ data: null, status: "unauthenticated" as const }),
  };
});

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  mockSignIn.mockReset();
});

test("shows a validation error when submitting without email or password", async () => {
  renderWithProviders(<LoginPage />);

  const submit = screen.getByRole("button", { name: /log in/i });
  fireEvent.click(submit);

  // I expect the page to nudge the user about missing fields instead of
  // quietly doing nothing or hammering the auth endpoint.
  await waitFor(() => {
    expect(
      screen.getByText(/please enter both email and password/i)
    ).toBeInTheDocument();
  });

  expect(mockSignIn).not.toHaveBeenCalled();
});

test("shows an error when credentials are rejected by next-auth", async () => {
  mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });

  renderWithProviders(<LoginPage />);

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "wrong@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "bad-password" },
  });

  const submit = screen.getByRole("button", { name: /log in/i });
  fireEvent.click(submit);

  // The main thing I care about here is surfacing a human-friendly message
  // when NextAuth says "nope" to a credentials attempt.
  await waitFor(() => {
    expect(
      screen.getByText(/invalid email or password/i)
    ).toBeInTheDocument();
  });

  expect(mockSignIn).toHaveBeenCalled();
});