

## Adding Goal Management for Admin

Currently, the "Goals" section in the admin client view is read-only. This plan adds full CRUD (create, edit, delete) capabilities for goals.

### What will change

**File: `src/pages/admin/AdminClientView.tsx`**

1. **New state variables:**
   - `showGoalForm` (boolean) -- modal visibility
   - `editingGoalId` (string | null) -- null = create, string = edit
   - `goalForm` -- `{ title: string, amount: string, has_amount: boolean, progress: number }`

2. **New handler functions** (following existing patterns for sessions/protocols):
   - `openCreateGoal()` -- reset form, open modal
   - `openEditGoal(goal)` -- populate form from existing goal, open modal
   - `handleSaveGoal()` -- insert or update via `externalDb.admin`, reload data
   - `handleDeleteGoal(id)` -- delete via `externalDb.admin.delete('goals', { id })`, reload data

3. **UI changes to the Goals section** (line ~554):
   - Add an "Add" button to the section header (same as sessions/protocols)
   - Add edit and delete icon buttons to each goal card
   - Add a modal form with fields: Title, Amount toggle + input, Progress slider/input

4. **New modal form** (using existing `ModalOverlay` component):
   - Title input (required)
   - Checkbox "Has amount" + amount input (conditionally shown)
   - Progress number input (0-100)
   - Save button

### Technical details

- No database changes needed -- the `goals` table already has all required columns
- Uses existing `externalDb.admin.insert/update/delete` API
- Follows the exact same pattern as sessions, protocols, and roadmaps CRUD in the same file
- Goal form fields map to DB columns: `title`, `amount`, `has_amount`, `progress`, `user_id`
