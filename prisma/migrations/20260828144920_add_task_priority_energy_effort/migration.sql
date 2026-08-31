-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "Energy" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "energy" "Energy",
ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "priority" "Priority";
