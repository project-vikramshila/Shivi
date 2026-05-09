export type AutomationAction = {
  type: 'click' | 'type' | 'navigate' | 'scroll';
  payload: Record<string, unknown>;
};

export const executeAutomationAction = async (action: AutomationAction) => {
  return {
    success: false,
    reason: 'Automation engine not implemented yet',
  };
};
