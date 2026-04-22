import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import { StudentsPage } from "@/pages/students-page";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/students/hooks", () => ({
  useStudents: () => ({
    data: [
      {
        id: "student-1",
        name: "Ana Souza",
        cpf: "12345678901",
        email: "ana@example.com",
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z"
      },
      {
        id: "student-2",
        name: "Bruno Lima",
        cpf: "98765432100",
        email: "bruno@example.com",
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z"
      },
      {
        id: "student-3",
        name: "Carla Nunes",
        cpf: "11122233344",
        email: "carla@example.com",
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z"
      }
    ],
    isLoading: false,
    isError: false,
    error: null
  }),
  useDeleteStudent: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  }),
  useCreateStudent: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  }),
  useUpdateStudent: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  })
}));

vi.mock("@/features/classes/hooks", () => ({
  useClassGroups: () => ({
    data: [
      {
        id: "class-1",
        topic: "Turma Alfa",
        year: 2026,
        semester: 1,
        studentIds: ["student-1", "student-2"],
        goalIds: [],
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z"
      },
      {
        id: "class-2",
        topic: "Turma Beta",
        year: 2026,
        semester: 1,
        studentIds: ["student-1"],
        goalIds: [],
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z"
      }
    ]
  })
}));

describe("StudentsPage", () => {
  it("filters students by class and shows unassigned students", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter initialEntries={["/students"]}>
        <Routes>
          <Route path="/students" element={<StudentsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText("Bruno Lima")).toBeInTheDocument();
    expect(screen.getByText("Carla Nunes")).toBeInTheDocument();
    expect(screen.getAllByText("Turma Alfa")).toHaveLength(3);
    expect(screen.getAllByText("Turma Beta")).toHaveLength(2);
    expect(screen.getAllByText("Sem turma")).toHaveLength(2);

    await user.selectOptions(screen.getByLabelText("Turma"), "class-2");

    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.queryByText("Bruno Lima")).not.toBeInTheDocument();
    expect(screen.queryByText("Carla Nunes")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Turma"), "__unassigned__");

    expect(screen.getByText("Carla Nunes")).toBeInTheDocument();
    expect(screen.queryByText("Ana Souza")).not.toBeInTheDocument();
    expect(screen.queryByText("Bruno Lima")).not.toBeInTheDocument();
  });
});
