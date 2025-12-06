// src/__tests__/auth/SignupPage.test.tsx

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SignupPage from "@/app/(auth)/signup/page";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/authRedirect";

jest.mock("next-auth/react", () => ({
  __esModule: true,
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

// Shared search params state, just like in the Login tests.
let currentSearchParams = new URLSearchParams();

const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => currentSearchParams.get(key),
  }),
}));

const { useSession, signIn } = jest.requireMock("next-auth/react");

function mockSession(
  status: "authenticated" | "unauthenticated" | "loading"
) {
  (useSession as jest.Mock).mockReturnValue({ status });
}

function setSearchParams(params: URLSearchParams) {
  currentSearchParams = params;
}

describe("SignupPage callbackUrl handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setSearchParams(new URLSearchParams());

    // Default fetch mock for the signup API call; tests can override if needed.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;
  });

  it("redirects to /pets/:id after signup + auto-login with that callbackUrl", async () => {
    setSearchParams(new URLSearchParams({ callbackUrl: "/pets/abc123" }));

    mockSession("unauthenticated");
    (signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
      url: "/pets/abc123",
    });

    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/name/i), "Jane Tester");
    await user.type(screen.getByLabelText(/^email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(
      screen.getByRole("button", { name: /create account/i })
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/pets/abc123");
    });
  });

  it("redirects already-authenticated users to a safe callbackUrl", async () => {
    setSearchParams(new URLSearchParams({ callbackUrl: "/care-circle" }));

    mockSession("authenticated");

    render(<SignupPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/care-circle");
    });
  });

  it("falls back to /dashboard when callbackUrl is external", async () => {
    setSearchParams(
      new URLSearchParams({ callbackUrl: "https://evil.com/signup" })
    );

    mockSession("authenticated");

    render(<SignupPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(DEFAULT_AUTH_REDIRECT);
    });
  });
});