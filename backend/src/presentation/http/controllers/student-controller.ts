import { Request, Response } from "express";

import { CreateStudentUseCase } from "../../../application/use-cases/create-student-use-case";
import { DeleteStudentUseCase } from "../../../application/use-cases/delete-student-use-case";
import { GetStudentUseCase } from "../../../application/use-cases/get-student-use-case";
import { ListStudentsUseCase } from "../../../application/use-cases/list-students-use-case";
import { UpdateStudentUseCase } from "../../../application/use-cases/update-student-use-case";

export class StudentController {
  constructor(
    private readonly createStudentUseCase: CreateStudentUseCase,
    private readonly listStudentsUseCase: ListStudentsUseCase,
    private readonly getStudentUseCase: GetStudentUseCase,
    private readonly updateStudentUseCase: UpdateStudentUseCase,
    private readonly deleteStudentUseCase: DeleteStudentUseCase
  ) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const student = await this.createStudentUseCase.execute(request.body);
    response.status(201).json(student);
  };

  list = async (_request: Request, response: Response): Promise<void> => {
    const students = await this.listStudentsUseCase.execute();
    response.status(200).json(students);
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const student = await this.getStudentUseCase.execute(request.params.id as string);
    response.status(200).json(student);
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const student = await this.updateStudentUseCase.execute(
      request.params.id as string,
      request.body
    );
    response.status(200).json(student);
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.deleteStudentUseCase.execute(request.params.id as string);
    response.status(204).send();
  };
}
