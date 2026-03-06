/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OutputPanel } from "@/components/OutputPanel";
const mockOutput = "<task>Test intention</task>";

const defaultProps = {
  output: mockOutput,
  isLoading: false,
  activeRules: new Set<"A01" | "A02" | "A03" | "A04" | "A05" | "A06" | "A07" | "A08" | "A09" | "A10">(["A01"]),
  intention: "Crée une route api en Node",
};

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe("OutputPanel — copy button", () => {
  it("copies output when clicking Copy", async () => {
    render(<OutputPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy/i }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockOutput);
    });
  });

  it("shows 'Copié !' feedback after copy then reverts", async () => {
    jest.useFakeTimers();
    render(<OutputPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Copy/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copié/i })).toBeInTheDocument();
    });

    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copy/i })).toBeInTheDocument();
    });
  });

  it("disables copy button when clipboard is unavailable", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<OutputPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Copy/i })).toBeDisabled();
  });
});

describe("OutputPanel — rendering states", () => {
  it("shows loading skeleton when isLoading is true", () => {
    const { container } = render(
      <OutputPanel {...defaultProps} isLoading={true} />
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows placeholder when output is null", () => {
    render(<OutputPanel {...defaultProps} output={null} />);
    expect(screen.getByText(/Le prompt sécurisé apparaîtra ici/i)).toBeInTheDocument();
  });

  it("shows coverage score badge", () => {
    render(<OutputPanel {...defaultProps} />);
    expect(screen.getByTitle("Couverture OWASP")).toBeInTheDocument();
    expect(screen.getByTitle("Couverture OWASP")).toHaveTextContent("1/10 règles");
  });
});
