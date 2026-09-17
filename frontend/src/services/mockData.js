/**
 * Mock Mode Data & Event Simulator
 * Provides a deterministic, realistic rehearsal flow matching docs/demo-scenario.md:
 * 1. Stable initial grid
 * 2. Chaos failure: Substation S2 offline, Hospital disconnected
 * 3. Planner selects redistribution_engine -> FAILS with TRANSMISSION_OVERLOAD on TL4
 * 4. Recovery triggered -> Replans to priority_load_manager
 * 5. Priority load manager sheds Factory load -> Restores Hospital power
 * 6. Code-verified outcome validation -> Mission completed!
 */

export const INITIAL_MOCK_GRID = {
  timestamp: Date.now() / 1000,
  generation_mw: 180,
  demand_mw: 150,
  generators: [
    { id: 'G1', type: 'generator', capacity_mw: 100, available_mw: 90, online: true },
    { id: 'G2', type: 'generator', capacity_mw: 100, available_mw: 90, online: true }
  ],
  substations: [
    { id: 'S1', type: 'substation', online: true },
    { id: 'S2', type: 'substation', online: true },
    { id: 'S3', type: 'substation', online: true }
  ],
  transmission_lines: [
    { id: 'TL1', from: 'S1', to: 'S2', capacity_mw: 80, load_mw: 50, online: true },
    { id: 'TL4', from: 'S2', to: 'S3', capacity_mw: 60, load_mw: 40, online: true }
  ],
  loads: [
    { id: 'HOSPITAL', type: 'hospital', demand_mw: 30, supplied_mw: 30, priority: 'critical', connected: true },
    { id: 'WATER_PLANT', type: 'water_plant', demand_mw: 25, supplied_mw: 25, priority: 'critical', connected: true },
    { id: 'RESIDENTIAL_1', type: 'residential', demand_mw: 40, supplied_mw: 40, priority: 'normal', connected: true },
    { id: 'FACTORY', type: 'industrial', demand_mw: 45, supplied_mw: 45, priority: 'normal', connected: true }
  ],
  battery: { id: 'B1', capacity_mwh: 100, remaining_mwh: 80, max_output_mw: 40, online: true },
  failures: []
};

export const INITIAL_MOCK_AGENT = {
  mission: {
    mission_id: 'mock-mission-001',
    goal: 'Maintain power to critical facilities',
    status: 'IDLE',
    plan_id: 0,
    observation_count: 0,
    previous_failures: [],
    known_constraints: ['TL4 capacity 60MW'],
    critical_loads: ['HOSPITAL', 'WATER_PLANT', 'EMERGENCY_SERVICES']
  },
  last_observation_id: 0,
  memory_context: {
    previous_failures: [],
    known_constraints: [],
    recent_actions: []
  }
};

export const MOCK_SCRIPTED_STEPS = [
  // Step 0: Chaos trigger
  {
    event: {
      type: 'CHAOS_EVENT',
      timestamp: Date.now() / 1000,
      message: 'Chaos Injected: Substation S2 tripped offline. Hospital load disconnected.',
      data: { event_type: 'SUBSTATION_FAILURE', target: 'S2' }
    },
    gridPatch: {
      substations: [{ id: 'S1', online: true }, { id: 'S2', online: false }, { id: 'S3', online: true }],
      loads: [
        { id: 'HOSPITAL', demand_mw: 30, supplied_mw: 0, priority: 'critical', connected: false },
        { id: 'WATER_PLANT', demand_mw: 25, supplied_mw: 25, priority: 'critical', connected: true },
        { id: 'RESIDENTIAL_1', demand_mw: 40, supplied_mw: 40, priority: 'normal', connected: true },
        { id: 'FACTORY', demand_mw: 45, supplied_mw: 45, priority: 'normal', connected: true }
      ],
      failures: ['Substation S2 offline', 'Critical facility HOSPITAL disconnected']
    },
    agentPatch: {
      mission: { status: 'RUNNING' }
    }
  },
  // Step 1: Observation
  {
    event: {
      type: 'OBSERVATION',
      plan_id: 1,
      timestamp: Date.now() / 1000,
      message: 'Agent observed deficit: HOSPITAL unpowered (0/30MW). Substation S2 offline.',
      data: { observation_id: 1, critical_unserved: ['HOSPITAL'] }
    },
    agentPatch: {
      mission: { plan_id: 1, observation_count: 1 }
    }
  },
  // Step 2: Plan Created
  {
    event: {
      type: 'PLAN_CREATED',
      plan_id: 1,
      tool: 'redistribution_engine',
      timestamp: Date.now() / 1000,
      message: 'Plan #1 created: Attempt power rerouting across transmission line TL4 towards S2.',
      data: { reason: 'Reroute via TL4 to restore S2 without shedding load.', arguments: { target_substation: 'S2' } }
    }
  },
  // Step 3: Tool Execution & Failure
  {
    event: {
      type: 'TOOL_FAILED',
      plan_id: 1,
      tool: 'redistribution_engine',
      timestamp: Date.now() / 1000,
      message: 'Execution rejected: TRANSMISSION_OVERLOAD on line TL4.',
      data: {
        error: {
          code: 'TRANSMISSION_OVERLOAD',
          message: 'Requested redistribution would exceed TL4 capacity.',
          details: { line: 'TL4', attempted_mw: 71.0, capacity_mw: 60.0 }
        }
      }
    },
    gridPatch: {
      transmission_lines: [
        { id: 'TL1', from: 'S1', to: 'S2', capacity_mw: 80, load_mw: 50, online: true },
        { id: 'TL4', from: 'S2', to: 'S3', capacity_mw: 60, load_mw: 71, online: true, overloaded: true }
      ]
    },
    agentPatch: {
      mission: {
        previous_failures: ['redistribution_engine: TL4 capacity overload (attempted 71MW > 60MW)'],
        known_constraints: ['TL4 maximum capacity is strictly 60MW']
      }
    }
  },
  // Step 4: Replan Triggered
  {
    event: {
      type: 'REPLAN_STARTED',
      plan_id: 2,
      timestamp: Date.now() / 1000,
      message: 'Dynamic Replan #2: Planner incorporating TL4 constraint into next decision.',
      data: { failure_context: 'redistribution_engine failed due to line constraint' }
    },
    agentPatch: {
      mission: { plan_id: 2 }
    }
  },
  // Step 5: Plan #2: Priority Load Manager
  {
    event: {
      type: 'PLAN_CREATED',
      plan_id: 2,
      tool: 'priority_load_manager',
      timestamp: Date.now() / 1000,
      message: 'Plan #2 created: Shed non-critical FACTORY load to guarantee HOSPITAL stability.',
      data: { reason: 'Protect critical infrastructure by selective load shedding.', arguments: { protect_critical: true } }
    }
  },
  // Step 6: Tool Success
  {
    event: {
      type: 'TOOL_SUCCESS',
      plan_id: 2,
      tool: 'priority_load_manager',
      timestamp: Date.now() / 1000,
      message: 'Tool executed successfully: Shed FACTORY (45MW); HOSPITAL power restored.',
      data: { served: ['HOSPITAL', 'WATER_PLANT'], shed: ['FACTORY'] }
    },
    gridPatch: {
      transmission_lines: [
        { id: 'TL1', from: 'S1', to: 'S2', capacity_mw: 80, load_mw: 45, online: true },
        { id: 'TL4', from: 'S2', to: 'S3', capacity_mw: 60, load_mw: 35, online: true, overloaded: false }
      ],
      loads: [
        { id: 'HOSPITAL', demand_mw: 30, supplied_mw: 30, priority: 'critical', connected: true },
        { id: 'WATER_PLANT', demand_mw: 25, supplied_mw: 25, priority: 'critical', connected: true },
        { id: 'RESIDENTIAL_1', demand_mw: 40, supplied_mw: 40, priority: 'normal', connected: true },
        { id: 'FACTORY', demand_mw: 45, supplied_mw: 0, priority: 'normal', connected: false }
      ],
      failures: ['FACTORY load shed (intentional load management)']
    }
  },
  // Step 7: Validation & Completion
  {
    event: {
      type: 'VALIDATION_PASSED',
      plan_id: 2,
      timestamp: Date.now() / 1000,
      message: 'Physical constraints verified: All critical facilities 100% powered. Line limits safe.',
      data: { critical_loads_satisfied: true, line_limits_respected: true }
    }
  },
  {
    event: {
      type: 'MISSION_COMPLETED',
      plan_id: 2,
      timestamp: Date.now() / 1000,
      message: 'Mission Goal verified and accomplished autonomously!',
      data: { total_steps: 2, replan_count: 1 }
    },
    agentPatch: {
      mission: { status: 'COMPLETED' }
    }
  }
];
