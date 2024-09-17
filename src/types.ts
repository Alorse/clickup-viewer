// Clickup Types
export type Task = {
    id: string,
    custom_id: string | null,
    name: string,
    text_content: string,
    description: string,
    markdown_description: string,
    status: Status,
    orderindex: string;
    date_created: string,
    date_updated: string,
    date_closed: string,
    date_done: string,
    creator: Creator,
    assignees: Assignee[],
    watchers: Watcher[]
    checklists: Checklist[],
    tags: Tag[],
    parent: string | null,
    priority: Priority | null,
    due_date: string | null,
    start_date: string,
    points: number | null,
    time_estimate: number | null,
    custom_fields: CustomField[],
    dependecies: Dependecie[],
    linked_tasks: Task[],
    team_id: string,
    url: string,
    permission_level: string,
    list: List,
    project: Project,
    folder: Folder,
    space: Space,
};

export type Status = {
    status: string,
    type: string,
    orderindex: number
    color: string,
};

export type Creator = {
    id: number,
    username: string,
    color: string,
    email: string,
    profilePicture: string
};

export type Assignee = Creator;
export type Watcher = Creator;

export type Checklist = {
    id: string,
    task_id: string,
    name: string,
    date_created: string,
    orderindex: number
    creator: number,
    resolved: boolean,
    unresolved: boolean,
    items: Item[]
};

export type Item = {
    id: string,
    name: string,
    orderindex: number,
    assignee: number | null,
    resolved: boolean,
    parent: string | null,
    date_created: string
    children: Item[]
}

export type Tag = {
    name: string,
    tag_fg: string,
    tag_bg: string,
    creator: number
};

export type Priority = {
    id: string,
    priority: string,
    color: string,
    orderindex: number
}

export type CustomField = {
    id: string,
    name: string,
    type: string,
    type_config: TypeConfig,
    date_created: string,
    hide_from_guests: boolean
    required: boolean
    value: any
};
export type TypeConfig = undefined;

export type Dependecie = undefined;

export type List = {
    id: string,
    name: string,
    access: boolean
};

export type Project = {
    id: string,
    name: string,
    hidden: boolean,
    access: boolean
};

export type Folder = Project;

export type Space = {
    id: string,
    name: string,
    private: boolean,
    color: string | null,
    avatar: string | null,
    admin_can_manage: boolean,
    archived: boolean,
    members: Member[],
    statuess: Status[],
    multiple_assignees: boolean,
    features: any
};

export type Team = {
    id: string,
    name: string,
    color: string,
    avatar: string,
    members: Member[]
};

export type Member = {
    id: number,
    username: string,
    email: string,
    color: string,
    initials: string,
    profilePicture: string,
    profileInfo: ProfileInfo
};

export type ProfileInfo = {
    display_profile: boolean,
    verified_ambassador: null,
    verified_consultant: null,
    top_tier_user: null,
    viewed_verified_ambassador: null,
    viewed_verified_consultant: null,
    viewed_top_tier_user: null
};

export type User = {
    id: number,
    username: string
    email: string,
    color: string,
    initials: string,
    profilePicture: string,
};

export type Interval = {
    id: string,
    start: string,
    end: string,
    time: string
    source: string,
    date_added: string,
};

export type Tracking = {
    intervals: Interval[],
    time: number,
    user: User
};

export type CreateTime = {
    description?: string,
    tags?: Tag[],
    start?: number,
    billable?: boolean,
    duration?: number,
    assignee?: number,
    tid: string,
    fromTimesheet?: boolean
};

export type Time = {
    id: string,
    task: Task,
    wid: string
    user: User,
    billable: boolean,
    start: string,
    end?: string,
    duration: string,
    description: string,
    tags: Tag[],
    source: string,
    at: string,
    task_location: TaskLocation,
    task_tags: Tag[]
    task_url: string,
};

export type TaskLocation = {
    folder_id: string,
    list_id: string,
    space_id: string
};