
export class DecisionEngine {
  static async evaluate(intentData, message, jid) {
    let mode = 'CASUAL';
    if (intentData.user_needs.includes('comfort') || intentData.user_needs.includes('listen')) mode = 'DEEP_TALK';
    if (intentData.user_needs.includes('joke')) mode = 'JOKING';
    if (intentData.user_needs.includes('react_only') || intentData.energy === 'low') mode = 'QUIET';
    
    if (intentData.action === 'silent') return { route: 'SILENT', mode };
    
    if (intentData.action === 'use_tool' || (intentData.suggested_tool && intentData.suggested_tool !== 'none')) {
        let cmd = intentData.suggested_tool;
        let args = intentData.tool_args;
        return { route: 'USE_TOOL', tool: cmd, args: args, mode };
    }
    
    return { route: 'GENERATE_REPLY', mode, needs: intentData.user_needs, energy: intentData.energy, topic: intentData.detected_topic };
  }
}
