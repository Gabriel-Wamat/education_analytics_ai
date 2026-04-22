import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import { StudentProfilePage } from "@/pages/student-profile-page";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/students/hooks", () => ({
  useStudentProfile: () => ({
    data: {
      student: {
        id: "student-1",
        name: "Ana Souza",
        cpf: "12345678901",
        email: "ana@example.com",
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T10:00:00.000Z"
      },
      summary: {
        totalClasses: 2,
        totalGoals: 6,
        totalEvaluations: 4,
        manaCount: 1,
        mpaCount: 1,
        maCount: 2,
        attainmentPercentage: 63
      },
      classes: [
        {
          id: "class-1",
          topic: "Turma Alfa",
          year: 2026,
          semester: 1,
          goalCount: 4,
          evaluationCount: 3
        }
      ],
      evaluations: [
        {
          id: "evaluation-1",
          classId: "class-1",
          classLabel: "Turma Alfa · 2026/1º semestre",
          goalId: "goal-1",
          goalName: "Leitura",
          level: "MA",
          score: 1,
          createdAt: "2026-04-22T09:00:00.000Z",
          updatedAt: "2026-04-22T10:00:00.000Z"
        }
      ],
      timeline: [
        {
          label: "1ª meta",
          date: "2026-04-22T10:00:00.000Z",
          averageScore: 1,
          attainmentPercentage: 100,
          evaluatedGoals: 1
        }
      ],
      emailLogs: [
        {
          id: "email-1",
          subject: "Resumo diário das suas avaliações",
          digestDate: "2026-04-22",
          status: "sent",
          attemptedAt: "2026-04-22T18:00:00.000Z",
          entriesCount: 2
        }
      ]
    },
    isLoading: false,
    isError: false,
    error: null
  })
}));

describe("StudentProfilePage", () => {
  it("renders the student profile with summary, evaluations and email logs", async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/students/student-1"]}>
        <Routes>
          <Route path="/students/:studentId" element={<StudentProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText("Ana Souza")).toHaveLength(2);
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("Turma Alfa")).toHaveLength(2);
    expect(screen.getByText("Leitura")).toBeInTheDocument();
    expect(screen.getByText("Resumo diário das suas avaliações")).toBeInTheDocument();
  });
});
