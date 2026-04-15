export interface Member {
    userId: string;
    email: string;
    name: string;
    role: string;
    subGroupId: string | null;
    subGroupRole?: string;   // RESPONSABLE, ASSISTANT, MEMBRE
    status: string;
    joinedDate: Date;
  }
  
  export interface SubGroup {
    id?: string;
    name: string;
    description: string;
    memberIds: string[];
  }
  
  export interface ClubRules {
    about: string;
    rules: string[];
    requiresApproval: boolean;
  }
  
  export interface Club {
    id?: string;
    name: string;
    description: string;
    category: string;
    visibility: string;
    creationDate?: Date;
    createdBy?: string;
    logoUrl?: string;
    colorPalette?: string;
    rules?: ClubRules;
    members: Member[];
    subGroups: SubGroup[];
  }
  
  export interface SubGroupRecommendation {
    subGroupId: string;
    subGroupName: string;
    suggestedRole: string;
    reason: string;
  }