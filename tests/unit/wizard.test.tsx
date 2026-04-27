import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Wizard } from "@/components/form/Wizard";

beforeEach(() => {
  localStorage.clear();
});

describe("Wizard", () => {
  it("renders step 1 by default", () => {
    render(<Wizard />);
    expect(screen.getByTestId("wizard-step")).toHaveTextContent("1");
  });

  it("persists draft to localStorage on input", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    const matricula = screen.getByLabelText(/matrícula/i);
    await user.type(matricula, "AA-11-BB");
    const stored = JSON.parse(localStorage.getItem("avaliar-draft") ?? "{}");
    expect(stored.matricula).toBe("AA-11-BB");
  });

  it("blocks Next when step 1 invalid", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    await user.click(screen.getByRole("button", { name: /seguinte/i }));
    expect(screen.getByTestId("wizard-step")).toHaveTextContent("1");
    expect(screen.getByText(/matrícula/i)).toBeInTheDocument();
  });
});
