const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "";

interface TaskPlan {
    summary: string;
    estimatedTotalMinutes: number;
    subtasks: Array<{
        title: string;
    }>;
}

async function callOpenRouter(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!API_KEY) {
        throw new Error("API Key not configured");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "",
            "X-Title": "Zenith AI Task Planner",
        },
        body: JSON.stringify({
            model: "openai/gpt-3.5-turbo",
            messages,
            max_tokens: 1000,
        })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

export async function breakDownTask(taskTitle: string): Promise<TaskPlan | null> {
    try {
        const prompt = `Break down the following task into actionable subtasks and provide an estimated time:

Task: "${taskTitle}"

Please respond in the following JSON format:
{
  "summary": "A brief 1-2 sentence summary of the task",
  "estimatedTotalMinutes": <number>,
  "subtasks": [
    { "title": "Subtask 1" },
    { "title": "Subtask 2" },
    ...
  ]
}

Provide 3-5 specific, actionable subtasks. Keep the response concise and practical.`;

        const response = await callOpenRouter([
            { role: 'user', content: prompt }
        ]);

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in AI response');
            return null;
        }

        const plan: TaskPlan = JSON.parse(jsonMatch[0]);
        return plan;
    } catch (error) {
        console.error('Error breaking down task:', error);
        return null;
    }
}

import { Habit } from '../types';

export async function generateRoutine(goal: string): Promise<Habit[]> {
    try {
        const prompt = `Create a daily habit routine for the following goal: "${goal}".
        
        Return a JSON array of 3-7 specific, actionable daily habits.
        Format:
        [
            { 
                "title": "Habit Title", 
                "category": "Health/Productivity/Mindfulness/etc",
                "icon": "Emoji",
                "description": "Short motivation or instruction",
                "color": "Tailwind gradient class (e.g., 'from-orange-500 to-red-500')",
                "frequency": "Everyday/Weekdays/Weekends/3x/Week"
            },
            ...
        ]
        
        Keep titles short and punchy (under 5 words). Use relevant emojis for icons.`;

        const response = await callOpenRouter([
            { role: 'user', content: prompt }
        ]);

        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("No JSON array found in response");
        }

        const rawHabits = JSON.parse(jsonMatch[0]);

        return rawHabits.map((h: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            title: h.title,
            category: h.category || 'Personal',
            icon: h.icon || '📝',
            description: h.description || '',
            color: h.color || 'from-blue-500 to-cyan-500',
            frequency: h.frequency || 'Everyday',
            createdAt: new Date().toISOString()
        }));

    } catch (error) {
        console.error("Error generating routine:", error);
        throw error;
    }
}
