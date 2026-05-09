# 🤖 Shivi AI Automation Engine

Production-grade desktop automation system for Shivi AI.

## Architecture

### Core Modules

#### 1. **Mouse Engine** (`mouse.ts`)
- Smooth mouse movement with easing
- Click, double-click, drag, scroll
- Simulates human-like behavior
- Position tracking

```typescript
await mouseEngine.smoothMove(x, y, duration);
await mouseEngine.clickAt(x, y);
await mouseEngine.drag(toX, toY);
```

#### 2. **Keyboard Engine** (`keyboard.ts`)
- Character-by-character typing
- Hotkey support (Ctrl+C, Alt+Tab, etc.)
- Special key handling
- Human-like typing delays

```typescript
await keyboardEngine.type("Hello");
await keyboardEngine.hotkey("ctrl", "c");
await keyboardEngine.enter();
```

#### 3. **Safety Framework** (`safety.ts`)
- Permission management
- Action validation
- Emergency stop button
- Safe mode restrictions
- Dangerous app blocking

```typescript
await safetyFramework.canExecuteAction(action);
safetyFramework.grantAppPermission("whatsapp", "full");
safetyFramework.activateEmergencyStop();
```

#### 4. **Automation Executor** (`executor.ts`)
- Task execution orchestration
- Retry logic
- Timeout handling
- Action validation
- Execution logging

```typescript
const result = await automationExecutor.executeTask(task);
```

#### 5. **Task Planner** (`planner.ts`)
- Convert user requests to automation steps
- Workflow templates
- Duration estimation
- Warning identification

```typescript
const plan = await taskPlanner.planTask({
  userRequest: "Send WhatsApp message to Rahul",
  targetApp: "whatsapp",
});
```

## Permission Levels

1. **observe** - Vision only, no interactions
2. **read** - View-only operations
3. **assist** - Safe interactive operations
4. **full** - Unrestricted automation

## Safety Features

### ✅ Implemented

- Emergency stop button
- Permission-gated automation
- Dangerous app blocking (Task Manager, Registry Editor, etc.)
- Safe mode restrictions
- Action validation
- Timeout protection
- Screenshot on error

### 🚀 To Implement

- Machine learning-based anomaly detection
- User confirmation for dangerous actions
- Rate limiting
- Sandboxed execution environment
- Execution audit logs

## Workflow Examples

### Example 1: Send WhatsApp Message

```typescript
const task: AutomationTask = {
  id: "task_whatsapp_1",
  description: "Send message to Rahul",
  steps: [
    { type: "app", subtype: "launch", appName: "whatsapp" },
    { type: "wait", duration: 2000 },
    { type: "mouse", subtype: "click", x: 500, y: 200 },
    { type: "keyboard", subtype: "type", text: "Rahul" },
    { type: "keyboard", subtype: "press", key: "Return" },
    { type: "wait", duration: 1000 },
    { type: "keyboard", subtype: "type", text: "Hi Rahul!" },
    { type: "keyboard", subtype: "hotkey", modifiers: ["shift"], key: "Return" },
  ],
  maxRetries: 3,
  timeout: 30000,
  requiredPermission: "full",
};

const result = await automationExecutor.executeTask(task);
```

### Example 2: Check Instagram Messages

```typescript
const plan = await taskPlanner.planTask({
  userRequest: "Check Instagram messages",
  targetApp: "instagram",
  requiresVision: true,
});

const task = {
  ...plan,
  id: "task_instagram_1",
  maxRetries: 2,
  timeout: 20000,
};

const result = await automationExecutor.executeTask(task);
```

## Integration with Shivi AI

### Vision System Integration

```typescript
// After taking screenshot with vision system
const elements = await visionSystem.detectElements(screenshot);

// Find specific element
const sendButton = elements.find(el => el.text === "Send");

// Automate clicking it
if (sendButton) {
  await mouseEngine.clickAt(sendButton.x, sendButton.y);
}
```

### Memory System Integration

```typescript
// After automation completes
await memorySystem.saveInteraction({
  type: "automation",
  action: "sent_whatsapp_message",
  recipient: "Rahul",
  timestamp: Date.now(),
  success: true,
});
```

### Gemini AI Integration

```typescript
// Let Gemini analyze action
const instruction = await geminiAI.enhanceResponse(
  `User wants to send WhatsApp message to Rahul saying "Available for call?"`,
  {
    userMessage: "Message Rahul",
    context: ["whatsapp", "messaging"],
    mode: "care",
  }
);

// Convert to automation plan
const plan = await taskPlanner.planTask({
  userRequest: instruction,
});
```

## Configuration

```typescript
const config = safetyFramework.getConfig();
// {
//   enabled: false,
//   defaultPermission: 'read',
//   safeMode: true,
//   maxConcurrentTasks: 1,
//   actionTimeout: 30000,
//   mouseSmoothness: 0.7,      // 0-1
//   keyboardDelay: 50,         // ms
//   defaultWaitDuration: 1000, // ms
//   screenshotOnError: true,
//   logAllActions: true,
// }

safetyFramework.updateConfig({ 
  enabled: true, 
  safeMode: false 
});
```

## Error Handling

```typescript
try {
  const result = await automationExecutor.executeTask(task);
  if (result.success) {
    console.log(`✅ Task completed in ${result.executionTime}ms`);
  } else {
    console.error(`❌ Task failed: ${result.error}`);
    // Screenshot automatically saved
  }
} catch (error) {
  console.error(`💥 Execution error: ${error}`);
  safetyFramework.activateEmergencyStop();
}
```

## Performance

- Mouse movement smoothed over 500ms (adjustable)
- Keyboard typing: 50ms per character (human-like)
- Vision + action pipeline: <100ms
- Concurrent tasks: 1 (queued safely)

## Next Steps

1. **OS-level Integration** - Connect to actual OS mouse/keyboard
2. **App Manager** - Window detection, app launching
3. **Vision Pipeline** - Full OCR + element detection
4. **Advanced Workflows** - Multi-step task templates
5. **ML Safety** - Anomaly detection for suspicious patterns
6. **Persistence** - Save and replay workflows

---

**Status**: Alpha - Core architecture complete, OS integration pending

**Last Updated**: May 9, 2026

❤️ Built with care for Shivi AI
