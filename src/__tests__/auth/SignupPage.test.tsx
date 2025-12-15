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

const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

const { useSession, signIn } = jest.requireMock("next-auth/react");

function mockSession(
  status: "authenticated" | "unauthenticated" | "loading"
) {
  (useSession as jest.Mock).mockReturnValue({ status });
}

describe("SignupPage callbackUrl handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default fetch mock for the signup API call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;
  });

  it("redirects to /pets/:id after signup + auto-login with that callbackUrl", async () => {
    mockSession("unauthenticated");
    (signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
      url: "/pets/abc123",
    });

    const user = userEvent.setup();
    render(<SignupPage searchParams={{ callbackUrl: "/pets/abc123" }} />);

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
    mockSession("authenticated");

    render(<SignupPage searchParams={{ callbackUrl: "/hive" }} />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/hive");
    });
  });

  it("falls back to /dashboard when callbackUrl is external", async () => {
    mockSession("authenticated");

    render(
      <SignupPage
        searchParams={{ callbackUrl: "https://evil.com/signup" }}
      />
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(DEFAULT_AUTH_REDIRECT);
    });
  });
});