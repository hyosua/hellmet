/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Toggles } from "@/components/Toggles";
import type { OWASPRuleId } from "@/core/types";

describe("Toggles", () => {
  const noop = () => {};

  it("calls onChange with the correct id and active=true when an inactive toggle is clicked", () => {
    const onChange = jest.fn();
    render(
      <Toggles
        activeToggles={new Set()}
        autoDetected={new Set()}
        onChange={onChange}
        lang="en"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /A01 Access Control/i }));
    expect(onChange).toHaveBeenCalledWith("A01", true);
  });

  it("calls onChange with active=false when a manual toggle is clicked again", () => {
    const onChange = jest.fn();
    const active = new Set<OWASPRuleId>(["A03"]);
    render(
      <Toggles activeToggles={active} autoDetected={new Set()} onChange={onChange} lang="en" />
    );

    fireEvent.click(screen.getByRole("button", { name: /A03 Injection/i }));
    expect(onChange).toHaveBeenCalledWith("A03", false);
  });

  it("renders a rule in autoDetected with data-state='auto'", () => {
    const autoDetected = new Set<OWASPRuleId>(["A01"]);
    render(
      <Toggles activeToggles={new Set()} autoDetected={autoDetected} onChange={noop} lang="en" />
    );

    const btn = screen.getByRole("button", { name: /A01 Access Control/i });
    expect(btn).toHaveAttribute("data-state", "auto");
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders a manually activated rule with data-state='manual'", () => {
    const active = new Set<OWASPRuleId>(["A07"]);
    render(
      <Toggles activeToggles={active} autoDetected={new Set()} onChange={noop} lang="en" />
    );

    const btn = screen.getByRole("button", { name: /A07 Auth/i });
    expect(btn).toHaveAttribute("data-state", "manual");
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders an untouched rule with data-state='inactive'", () => {
    render(
      <Toggles activeToggles={new Set()} autoDetected={new Set()} onChange={noop} lang="en" />
    );

    const btn = screen.getByRole("button", { name: /A02 Crypto/i });
    expect(btn).toHaveAttribute("data-state", "inactive");
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("does not call onChange when an auto-detected toggle is clicked", () => {
    const onChange = jest.fn();
    const autoDetected = new Set<OWASPRuleId>(["A04"]);
    render(
      <Toggles activeToggles={new Set()} autoDetected={autoDetected} onChange={onChange} lang="en" />
    );

    fireEvent.click(screen.getByRole("button", { name: /A04 Insecure Design/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("union of autoDetected and activeToggles has no duplicates", () => {
    const autoDetected = new Set<OWASPRuleId>(["A01"]);
    const activeToggles = new Set<OWASPRuleId>(["A01", "A02"]);
    render(
      <Toggles activeToggles={activeToggles} autoDetected={autoDetected} onChange={noop} lang="en" />
    );

    const a01 = screen.getByRole("button", { name: /A01 Access Control/i });
    expect(a01).toHaveAttribute("data-state", "auto");

    const a02 = screen.getByRole("button", { name: /A02 Crypto/i });
    expect(a02).toHaveAttribute("data-state", "manual");
  });

  it("renders French labels when lang=fr", () => {
    render(
      <Toggles activeToggles={new Set()} autoDetected={new Set()} onChange={noop} lang="fr" />
    );

    expect(screen.getByRole("button", { name: /A01 Contrôle d'accès/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /A07 Authentification/i })).toBeInTheDocument();
  });
});
