# Ralph Agent Instructions - VoxelPhysics

You are an autonomous coding agent building a Minecraft-like voxel game with real physics.

## Your Task

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks: `npm run typecheck`
7. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
8. Update the PRD to set `passes: true` for the completed story
9. Append your progress to `progress.txt`

## Project-Specific Information

### Tech Stack
- **Three.js** - 3D rendering (import from 'three')
- **Rapier3D** - Physics engine (import from '@dimforge/rapier3d-compat')
- **TypeScript** - Type checking
- **Vite** - Dev server and bundling

### Quality Commands

```bash
# TypeScript type checking (REQUIRED before commit)
npm run typecheck

# Run dev server (for manual testing)
npm run dev

# Build for production
npm run build
```

### Important Patterns

1. **Rapier Initialization**: Rapier must be initialized asynchronously:
   ```typescript
   import RAPIER from '@dimforge/rapier3d-compat';
   await RAPIER.init();
   const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
   ```

2. **Physics-Mesh Sync**: Every frame, sync Three.js mesh position with Rapier body:
   ```typescript
   const position = rigidBody.translation();
   const rotation = rigidBody.rotation();
   mesh.position.set(position.x, position.y, position.z);
   mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
   ```

3. **Block Size**: Use 1x1x1 unit blocks for simplicity

4. **Coordinate System**: Y is up (Three.js default)

### File Structure

```
src/
  main.ts       - Entry point, scene setup, game loop
  physics.ts    - Rapier world initialization
  Block.ts      - Block class (mesh + physics body)
  Ground.ts     - Ground plane
  Controls.ts   - Player input handling
  Terrain.ts    - World generation
  Sound.ts      - Audio effects
  UI.ts         - Crosshair, instructions
  types.ts      - Shared types and enums
```

## Progress Report Format

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---
```

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Run `npm run typecheck` before every commit
- Keep changes focused and minimal
- Follow existing code patterns
- Read the Codebase Patterns section in progress.txt before starting
