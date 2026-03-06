import { getMixedColor } from "../utils";

declare global {
    var Regions: RegionsModule;
}

export interface Region {
    i: number;
}

const WEIGHTS = {
    biome: 1.0,
    culture: 1.0,
    state: 1.0,
    religion: 1.0,
};

class RegionsModule {
    generate(resolution=1.0) {
        TIME && console.time("generateRegions");
        const {cells} = pack;

        // Step 1: Filter Land Cells
        const landCells = Array.from(cells.i).filter(i => cells.h[i] >= 20);

        // Step 2: Build weighted graph
        const graph: Record<number, Record<number, number>> = {};

        for (const i of landCells) {
            graph[i] = {};
            for (const j of cells.c[i]) {
                if (cells.h[i] <= 20) continue;
                const weight = this.similarity(i, j);
                graph[i][j] = weight;
            }  
        }

        // Step 3: Louvain Community Detection
        const partition = this.louvain(graph, landCells, resolution);

        // Step 4: Build Region Objects
        const regions: Region[] = [0 as unknown as Region];
        const regionIds = new Uint16Array(cells.i.length);

        const communityIds = Array.from(new Set(Object.values(partition)));
        const community_to_region_id: Record<number, number> = {};

        communityIds.forEach((communityId, idx) => {
            const regionId = idx + 1;
            community_to_region_id[communityId] = regionId;
            regions.push( {i: regionId});
        });

        for (const cell_id of landCells) {
            const communityId = partition[cell_id];
            regionIds[cell_id] = community_to_region_id[communityId];
        }

        // Step 5: Write back to pack
        (cells as any).region = regionIds;
        pack.regions = regions;

        TIME && console.timeEnd("generateRegions");
        
    }

    private similarity(a:number, b:number): number {
        const { cells } = pack;
        let score = 0;
        let total = 0;
        if (WEIGHTS.biome) {score += cells.biome[a] === cells.biome[b] ? WEIGHTS.biome : 0; total += WEIGHTS.biome;}
        if (WEIGHTS.culture) {score += cells.culture[a] === cells.culture[b] ? WEIGHTS.culture : 0; total += WEIGHTS.culture;}
        if (WEIGHTS.religion) {score += cells.religion[a] === cells.religion[b] ? WEIGHTS.religion : 0; total += WEIGHTS.religion};
        if (WEIGHTS.state) {score += cells.state[a] === cells.state[b] ? WEIGHTS.state : 0; total += WEIGHTS.state};
        return total > 0 ? score / total : 0;
    }

    private louvain(
        graph: Record<number, Record<number, number>>,
        nodes: number[],
        resolution: number
    ): Record<number, number> {
        const partition: Record <number, number> = {};
        nodes.forEach(i => {partition[i] = i;});

        // TO-DO: Actual Louvain shit

        return partition;
    }
}

window.Regions = new RegionsModule();
