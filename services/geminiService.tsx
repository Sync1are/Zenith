
import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskPriority, TaskStatus } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    task: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'The main title for the overall task or goal.' },
        category: { type: Type.STRING, description: 'A relevant category for the task (e.g., "Development", "Study", "Fitness").' },
        priority: { type: Type.STRING, description: 'The priority of the task. Must be one of: "HIGH", "MEDIUM", or "LOW".' },
        subtasks: {
          type: Type.ARRAY,
          description: 'A list of 3-5 actionable subtasks to achieve the main goal.',
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'The title of the subtask.' },
              duration: { type: Type.STRING, description: 'An estimated duration for the subtask, like "30 min" or "1 hour".' },
            },
            required: ["title", "duration"],
          },
        },
      },
      required: ["title", "category", "priority", "subtasks"],
    },
  },
  required: ["task"],
};


export const generateTaskPlan = async (prompt: string): Promise<Task> => {
  try {
    const fullPrompt = `
      You are an expert task planning assistant. Your role is to break down a user's goal into a structured, actionable plan.
      
      User's goal: "${prompt}"

      Based on this goal, generate a comprehensive main task with 3 to 5 specific, actionable subtasks. Each subtask must have a realistic time estimate.
      The main task's priority should be determined by the likely importance of the user's goal.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.task || !parsedData.task.title) {
      throw new Error("Invalid response format from AI.");
    }
    
    const { task } = parsedData;

    const totalMinutes = task.subtasks.reduce((sum: number, st: any) => {
      const match = st.duration.match(/(\d+)\s*(min|hour)/i);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        return sum + (unit.includes('hour') ? value * 60 : value);
      }
      return sum;
    }, 0);

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
    }

    const mainTask: Task = {
      id: Date.now(),
      title: task.title,
      category: task.category,
      priority: task.priority as TaskPriority,
      duration: formatDuration(totalMinutes),
      remainingTime: totalMinutes * 60,
      status: TaskStatus.TODO,
      isCompleted: false,
      subtasks: task.subtasks.map((st: any, index: number) => ({
        id: Date.now() + index + 1,
        title: st.title,
        duration: st.duration,
        isCompleted: false,
      })),
    };

    return mainTask;

  } catch (error) {
    console.error("Error generating task plan with Gemini:", error);
    if (error instanceof Error && error.message.includes("API key")) {
        throw new Error("API Error: Please ensure your API key is valid and has sufficient quota.");
    }
    throw new Error("Could not generate task plan. Please try rephrasing your goal.");
  }
};
