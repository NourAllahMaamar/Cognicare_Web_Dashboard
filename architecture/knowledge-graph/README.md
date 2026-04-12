# CogniCare Knowledge Graph

Fresh code analysis from the current codebase (566 source files).

## 📊 Graph Stats

- **1,842 code entities** (nodes)
- **2,801 relationships** (edges)  
- **5,602 wiki links** in Obsidian vault

## 🗂️ What's Included

- `graph-data.json` - Raw graph data (nodes + links)
- `obsidian-vault/` - Obsidian-compatible markdown files with wiki links

## 🔭 How to View

### Option 1: Obsidian (Recommended)

1. Download [Obsidian](https://obsidian.md/)
2. File → Open Vault → Open folder as vault
3. Select: `cognicare/architecture/knowledge-graph/obsidian-vault`
4. Click **Graph view** in left sidebar

You'll see all your code as connected nodes. Click any node to see:
- The code entity (function, class, etc.)
- Links to what it references
- Links to what references it

### Option 2: JSON Data

Use `graph-data.json` with any graph visualization tool:
- Nodes have: `id`, `label`, `source_file`
- Links have: `source`, `target`, `relation`

## 🔄 Updating the Graph

To regenerate with fresh code:

```bash
cd /path/to/workspace
# Re-run graphify extraction
# Then copy new output here
```

## 📁 Source Directories Analyzed

- `cognicare/backend/src/` - NestJS API (273 files)
- `cognicare/frontend/lib/` - Flutter mobile app (212 files)
- `cognicareweb/src/` - React web dashboard (81 files)
