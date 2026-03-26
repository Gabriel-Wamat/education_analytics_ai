import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { renderWithProviders } from "@/test/utils";

describe("AppShell", () => {
  it("renders without theme toggle and keeps the sidebar collapsible", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/questions"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/questions" element={<div>Conteúdo da página</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByLabelText(/Ativar modo/i)).not.toBeInTheDocument();

    const collapseButton = screen.getByLabelText("Recolher menu lateral");
    fireEvent.click(collapseButton);

    expect(screen.getByLabelText("Expandir menu lateral")).toBeInTheDocument();
  });
});
