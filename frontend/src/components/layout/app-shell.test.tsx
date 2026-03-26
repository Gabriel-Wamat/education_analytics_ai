import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { renderWithProviders } from "@/test/utils";

describe("AppShell", () => {
  it("renders without theme toggle and expands the sidebar on hover", () => {
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

    const sidebar = screen.getByTestId("desktop-sidebar");
    expect(sidebar.className).toContain("w-[104px]");

    fireEvent.mouseEnter(sidebar);
    expect(sidebar.className).toContain("w-[286px]");

    fireEvent.mouseLeave(sidebar);
    expect(sidebar.className).toContain("w-[104px]");
  });
});
