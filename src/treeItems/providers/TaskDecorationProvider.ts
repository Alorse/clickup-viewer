import {window, Tab, TabInputText, Uri, Disposable, Event, EventEmitter, FileDecoration, FileDecorationProvider} from 'vscode';


export class TaskDecorationProvider implements FileDecorationProvider {

  private disposables: Array<Disposable> = [];

  private color: string = '#FFA500';

  private readonly _onDidChangeFileDecorations: EventEmitter<Uri | Uri[]> = new EventEmitter< Uri | Uri[]>();
  readonly onDidChangeFileDecorations: Event<Uri | Uri[]> = this._onDidChangeFileDecorations.event;

  constructor() {
    this.disposables = [];
    this.disposables.push(window.registerFileDecorationProvider(this));
  } 

  async updateActiveEditor(activeTab: Tab): Promise<void>  {

    if (activeTab.input instanceof TabInputText){
      this._onDidChangeFileDecorations.fire(activeTab.input.uri);
    }

    // filter to get only non-activeTabs
    activeTab.group.tabs.map( tab => {
      if (!tab.isActive && tab.input instanceof TabInputText){
        this._onDidChangeFileDecorations.fire(tab.input.uri);
      }
    });
  }

  async provideFileDecoration(uri: Uri, props?: any): Promise<FileDecoration | undefined> {
      return {
        badge: props.badge,
        color: props.color, 
      };
  }

  setColor(color: string) {
    this.color = color;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}