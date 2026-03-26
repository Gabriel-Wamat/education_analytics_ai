import {
  BarChartData,
  DashboardMetricsResponse,
  DonutChartQuestionGroup,
  LineChartData
} from "../../application/dto/dashboard-metrics-response";
import { ExamReport } from "../entities/exam-report";
import { ExamTemplate } from "../entities/exam-template";

interface QuestionAggregate {
  questionId: string;
  order: number;
  label: string;
  statement: string;
  totalScore: number;
  fullCorrectCount: number;
  optionCounts: Map<string, number>;
}

const buildQuestionAggregateMap = (examTemplate: ExamTemplate): Map<string, QuestionAggregate> =>
  new Map(
    examTemplate.questionsSnapshot.map((question, index) => [
      question.id,
      {
        questionId: question.id,
        order: index + 1,
        label: `Q${index + 1}`,
        statement: question.statement,
        totalScore: 0,
        fullCorrectCount: 0,
        optionCounts: new Map(question.options.map((option) => [option.id, 0]))
      }
    ])
  );

export const aggregateDashboardMetrics = (
  examReport: ExamReport,
  examTemplate: ExamTemplate
): DashboardMetricsResponse => {
  const totalStudents = examReport.studentsSnapshot.length;
  const totalQuestions = examTemplate.questionsSnapshot.length;
  const questionAggregateMap = buildQuestionAggregateMap(examTemplate);

  for (const student of examReport.studentsSnapshot) {
    for (const questionResult of student.questionResults) {
      const aggregate = questionAggregateMap.get(questionResult.originalQuestionId);
      if (!aggregate) {
        continue;
      }

      aggregate.totalScore += questionResult.score;
      if (questionResult.wasFullyCorrect) {
        aggregate.fullCorrectCount += 1;
      }

      for (const selectedOptionId of questionResult.selectedOptionIds) {
        aggregate.optionCounts.set(
          selectedOptionId,
          (aggregate.optionCounts.get(selectedOptionId) ?? 0) + 1
        );
      }
    }
  }

  const lineChartData: LineChartData[] = [];
  const barChartData: BarChartData[] = [];
  const donutChartsByQuestion: DonutChartQuestionGroup[] = [];

  for (const [index, question] of examTemplate.questionsSnapshot.entries()) {
    const aggregate = questionAggregateMap.get(question.id);
    if (!aggregate) {
      continue;
    }

    const averageScore = totalStudents === 0 ? 0 : aggregate.totalScore / totalStudents;
    const fullCorrectRate =
      totalStudents === 0 ? 0 : (aggregate.fullCorrectCount / totalStudents) * 100;

    lineChartData.push({
      questionId: question.id,
      unit: question.unit,
      order: index + 1,
      label: `Q${index + 1}`,
      statement: question.statement,
      averageScore,
      averagePercentage: averageScore * 100,
      fullCorrectRate
    });

    barChartData.push({
      questionId: question.id,
      order: index + 1,
      label: `Q${index + 1}`,
      statement: question.statement,
      accuracyRate: fullCorrectRate,
      averageScoreRate: averageScore * 100,
      totalStudents
    });

    const totalMarks = question.options.reduce(
      (sum, option) => sum + (aggregate.optionCounts.get(option.id) ?? 0),
      0
    );

    donutChartsByQuestion.push({
      questionId: question.id,
      order: index + 1,
      label: `Q${index + 1}`,
      statement: question.statement,
      data: question.options.map((option, optionIndex) => {
        const value = aggregate.optionCounts.get(option.id) ?? 0;

        return {
          questionId: question.id,
          optionId: option.id,
          label: `Opção ${optionIndex + 1}`,
          description: option.description,
          value,
          shareOfMarks: totalMarks === 0 ? 0 : (value / totalMarks) * 100,
          selectionRate: totalStudents === 0 ? 0 : (value / totalStudents) * 100,
          isCorrect: option.isCorrect
        };
      })
    });
  }

  const totalScores = examReport.studentsSnapshot.map((student) => student.totalScore);
  const averageScore =
    totalStudents === 0
      ? 0
      : totalScores.reduce((sum, score) => sum + score, 0) / totalStudents;

  return {
    examId: examReport.id,
    batchId: examReport.batchId,
    templateId: examReport.templateId,
    templateTitle: examReport.templateTitle,
    gradingStrategyType: examReport.gradingStrategyType,
    summary: {
      totalStudents,
      totalQuestions,
      averageScore,
      averagePercentage: totalQuestions === 0 ? 0 : (averageScore / totalQuestions) * 100,
      highestScore: totalScores.length === 0 ? 0 : Math.max(...totalScores),
      lowestScore: totalScores.length === 0 ? 0 : Math.min(...totalScores)
    },
    lineChartData,
    barChartData,
    donutChartsByQuestion
  };
};
