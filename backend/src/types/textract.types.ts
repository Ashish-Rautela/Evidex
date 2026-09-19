export interface TextractGeometry {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TextractBlock {
  text: string;
  blockType: string;
  geometry: TextractGeometry;
  pageNumber: number;
}

export interface PageContent {
  pageNumber: number;
  fullText: string;
  blocks: TextractBlock[];
}
