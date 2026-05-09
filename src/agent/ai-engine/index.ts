/**
 * AI-Powered Agent Decision Engine
 * Uses AI to make intelligent decisions about next steps, recovery strategies, and workflow adaptation.
 */

import type { AgentTaskStep, AgentWorkflow, AutonomySettings } from '../core/types';

export interface DecisionContext {
  currentStep: AgentTaskStep;
  workflow: AgentWorkflow;
  error?: string;
  previousAttempts: number;
  autonomy: AutonomySettings;
  recentHistory: AgentTaskStep[];
}

export interface AIDecision {
  recommendation: string;
  action: 'continue' | 'retry' | 'skip' | 'fallback' | 'ask_user' | 'cancel';
  confidence: number;
  reasoning: string;
  narrativeHindi?: string;
  alternativeActions: string[];
}

export class AIDecisionEngine {
  /**
   * Make intelligent decision about what to do next given current context
   */
  async makeDecision(context: DecisionContext): Promise<AIDecision> {
    const analysis = this.analyzeContext(context);

    // Determine next action based on error type, autonomy level, and history
    const action = this.selectAction(analysis, context);
    const alternatives = this.generateAlternatives(context, action);

    return {
      recommendation: this.getRecommendationText(action),
      action,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      narrativeHindi: this.generateNarrativeHindi(action, context),
      alternativeActions: alternatives,
    };
  }

  private analyzeContext(context: DecisionContext): { confidence: number; reasoning: string } {
    const { currentStep, workflow, error, previousAttempts, autonomy } = context;

    let confidence = 0.8;
    let reasoning = '';

    // Analyze error type
    if (!error) {
      confidence = 0.95;
      reasoning = 'No error detected, proceeding normally.';
      return { confidence, reasoning };
    }

    if (error.includes('timeout') || error.includes('network')) {
      confidence = 0.7;
      reasoning = 'Network-related issue detected, retry recommended.';
    } else if (error.includes('not found') || error.includes('not available')) {
      confidence = 0.6;
      reasoning = 'Resource unavailable, may need alternative approach.';
    } else if (error.includes('permission') || error.includes('unauthorized')) {
      confidence = 0.9;
      reasoning = 'Permission issue detected, user confirmation needed.';
    } else {
      confidence = 0.5;
      reasoning = 'Unknown error, fallback strategy recommended.';
    }

    // Reduce confidence based on retry attempts
    confidence = Math.max(0.2, confidence - previousAttempts * 0.15);

    return { confidence, reasoning };
  }

  private selectAction(analysis: { confidence: number; reasoning: string }, context: DecisionContext): AIDecision['action'] {
    const { currentStep, error, previousAttempts, autonomy } = context;

    // Always ask user for sensitive operations on permission errors
    if (error?.includes('permission') || error?.includes('unauthorized')) {
      return 'ask_user';
    }

    // In observe mode, never continue with risky actions
    if (autonomy.mode === 'observe') {
      return 'ask_user';
    }

    // Retry network issues
    if (error?.includes('timeout') || error?.includes('network')) {
      if (previousAttempts < 2) {
        return 'retry';
      }
    }

    // For suggest mode, ask user on failure
    if (autonomy.mode === 'suggest' && previousAttempts > 0) {
      return 'ask_user';
    }

    // For assist/autonomous mode, try fallback or skip
    if (error?.includes('not found') || error?.includes('not available')) {
      return 'fallback';
    }

    // Default behavior based on autonomy
    if (autonomy.mode === 'autonomous') {
      return 'retry';
    }

    return 'ask_user';
  }

  private generateAlternatives(context: DecisionContext, selectedAction: AIDecision['action']): string[] {
    const alternatives: string[] = [];
    const { currentStep } = context;

    if (selectedAction !== 'retry') {
      alternatives.push('Retry the operation');
    }

    if (selectedAction !== 'skip' && currentStep.action !== 'fetchContext') {
      alternatives.push('Skip this step');
    }

    if (selectedAction !== 'fallback') {
      alternatives.push('Try alternative method');
    }

    if (selectedAction !== 'cancel') {
      alternatives.push('Cancel workflow');
    }

    return alternatives;
  }

  private getRecommendationText(action: AIDecision['action']): string {
    const texts: Record<AIDecision['action'], string> = {
      continue: 'Proceeding with next step',
      retry: 'Retrying current operation',
      skip: 'Skipping this step',
      fallback: 'Trying alternative approach',
      ask_user: 'Need your decision',
      cancel: 'Stopping workflow',
    };
    return texts[action];
  }

  private generateNarrativeHindi(action: AIDecision['action'], context: DecisionContext): string {
    const step = context.currentStep.name;

    const narratives: Record<AIDecision['action'], string> = {
      continue: `"${step}" ho gaya! Agle kadam pe chalte hain.`,
      retry: `"${step}" ko dobara try karti hoon... 😌`,
      skip: `"${step}" ko abhi skip karti hoon, baad mein dekh lenge.`,
      fallback: `Hmm, normal tarika kaam nahi kar raha... ek aur method try karti hoon.`,
      ask_user: `"${step}" mein thoda problem aa gaya... kya karti hoon main?`,
      cancel: `Workflow ko cancel kar deti hoon.`,
    };

    return narratives[action];
  }

  /**
   * Assess if workflow should continue or be interrupted
   */
  shouldContinueWorkflow(workflow: AgentWorkflow, currentStep: AgentTaskStep, error?: string): boolean {
    // Stop if too many failures
    const failedSteps = workflow.steps.filter(s => s.status === 'failed').length;
    if (failedSteps > Math.ceil(workflow.steps.length * 0.3)) {
      return false;
    }

    // Stop on critical errors
    if (error?.includes('critical') || error?.includes('system')) {
      return false;
    }

    return true;
  }

  /**
   * Adapt workflow based on learned patterns
   */
  adaptWorkflow(workflow: AgentWorkflow, context: Record<string, any>): AgentWorkflow {
    // Could optimize step ordering based on success patterns
    // Could modify timeouts based on historical data
    // Could reorder apps based on availability patterns

    return workflow;
  }
}

export const aiDecisionEngine = new AIDecisionEngine();