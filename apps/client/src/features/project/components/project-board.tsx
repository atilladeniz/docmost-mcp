// Define interface locally to avoid import issues
interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  coverImage?: string | null;
  isArchived: boolean;
  startDate?: string;
  endDate?: string;
  spaceId: string;
  workspaceId: string;
  creatorId?: string;
  createdAt: string;
  updatedAt: string;
}

import { Board } from "./board";

interface ProjectBoardProps {
  project: Project;
  onBack: () => void;
}

export function ProjectBoard({ project, onBack }: ProjectBoardProps) {
  return <Board project={project} onBack={onBack} />;
}
