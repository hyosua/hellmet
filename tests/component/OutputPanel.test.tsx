/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OutputPanel } from "@/components/OutputPanel";
import type { Detection, PromptOutput } from "@/core/types";

const mockOutput: PromptOutput = {
  claude: "<task>Test intention</task>",
  gpt: "### Tâche\nTest intention",
};

const mockDetection: Detection = {
  language: "Node.js",
  domain: "api",
  matchedKeywords: ["node", "api"],
};

const defaultProps = {
  output: mockOutput,
  isLoading: false,
  detection: mockDetection,
  activeRules: new Set<"A01" | "A02" | "A03" | "A04" | "A05" | "A07" | "A09">(["A01"]),
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

describe("OutputPanel — copy buttons", () => {
  it("clicking 'Copy for Claude' writes output.claude to clipboard", async () => {
    render(<OutputPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy for Claude/i }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockOutput.claude);
    });
  });

  it("clicking 'Copy for GPT' writes output.gpt to clipboard", async () => {
    render(<OutputPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy for GPT/i }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockOutput.gpt);
    });
  });

  it("shows 'Copié !' feedback after copying for Claude", async () => {
    jest.useFakeTimers();
    render(<OutputPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Copy for Claude/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copié/i })).toBeInTheDocument();
    });

    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copy for Claude/i })).toBeInTheDocument();
    });
  });

  it("shows 'Copié !' feedback after copying for GPT", async () => {
    jest.useFakeTimers();
    render(<OutputPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Copy for GPT/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copié/i })).toBeInTheDocument();
    });
  });

  it("disables copy buttons when clipboard is unavailable", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<OutputPanel {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Copy for Claude/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Copy for GPT/i })).toBeDisabled();
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

  it("shows detection metadata when detection is set", () => {
    render(<OutputPanel {...defaultProps} />);
    expect(screen.getByText(/Node\.js · api/)).toBeInTheDocument();
    expect(screen.getByText(/A01/)).toBeInTheDocument();
  });
});
