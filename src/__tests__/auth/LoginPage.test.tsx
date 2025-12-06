// src/__tests__/auth/LoginPage.test.tsx

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginPage from "@/app/(auth)/login/page";
import { DEFAULT_AUTH_REDIRECT, getSafeCallbackUrl } from "@/lib/authRedirect";

jest.mock("next-auth/react", () => ({
  __esModule: true,
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

// We control the querystring for all tests via this shared variable.
// useSearchParams will always read from here.
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

describe("getSafeCallbackUrl", () => {
  it("returns default when callbackUrl is missing or empty", () => {
    expect(getSafeCallbackUrl(undefined)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getSafeCallbackUrl(null)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getSafeCallbackUrl("")).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("allows internal paths like /pets/:id and /care-circle", () => {
    expect(getSafeCallbackUrl("/pets/abc123")).toBe("/pets/abc123");
    expect(getSafeCallbackUrl("/care-circle")).toBe("/care-circle");
  });

  it("rejects absolute URLs and protocol-relative URLs", () => {
    expect(getSafeCallbackUrl("https://evil.com")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getSafeCallbackUrl("http://example.com")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getSafeCallbackUrl("//evil.com/redirect")).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("rejects non-root-relative strings and auth routes", () => {
    expect(getSafeCallbackUrl("pets/abc123")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getSafeCallbackUrl("/login")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getSafeCallbackUrl("/signup")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(getSafeCallbackUrl("/api/auth/signin")).toBe(DEFAULT_AUTH_REDIRECT);
  });
});

describe("LoginPage callbackUrl handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setSearchParams(new URLSearchParams());
  });

  it("redirects to /pets/:id when login succeeds with that callbackUrl", async () => {
    // Simulate /login?callbackUrl=/pets/abc123
    setSearchParams(new URLSearchParams({ callbackUrl: "/pets/abc123" }));

    mockSession("unauthenticated");
    (signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
      url: "/pets/abc123",
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/pets/abc123");
    });
  });

  it("redirects to /care-circle when login succeeds with that callbackUrl", async () => {
    setSearchParams(new URLSearchParams({ callbackUrl: "/care-circle" }));

    mockSession("unauthenticated");
    (signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
      url: "/care-circle",
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/care-circle");
    });
  });

  it("sends already-authenticated users to a safe callbackUrl", async () => {
    setSearchParams(new URLSearchParams({ callbackUrl: "/pets/abc123" }));

    mockSession("authenticated");

    render(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/pets/abc123");
    });
  });

  it("falls back to /dashboard when callbackUrl is external", async () => {
    setSearchParams(
      new URLSearchParams({ callbackUrl: "https://evil.com/redirect" })
    );

    mockSession("authenticated");

    render(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(DEFAULT_AUTH_REDIRECT);
    });
  });
});