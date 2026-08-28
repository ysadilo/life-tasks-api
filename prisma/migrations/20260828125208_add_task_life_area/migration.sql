-- CreateEnum
CREATE TYPE "LifeArea" AS ENUM ('home', 'health', 'money', 'social', 'admin');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "area" "LifeArea";
