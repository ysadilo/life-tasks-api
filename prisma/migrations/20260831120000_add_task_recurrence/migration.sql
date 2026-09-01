-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_templateId_fkey";

-- DropTable
DROP TABLE "TaskTemplate";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "templateId";

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('daily', 'weekdays', 'weekly', 'biweekly', 'monthly');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "recurrence" "Recurrence",
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "completedDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[];
