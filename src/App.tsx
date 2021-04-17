/*
*  Copyright (C) 1998-2021 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from 'gojs';
import { produce } from 'immer';
import { useEffect, useState } from 'react';
import { useImmer } from 'use-immer';

import { DiagramWrapper } from './components/DiagramWrapper';
import { SelectionInspector } from './components/SelectionInspector';

import './App.css';

/**
 * Use a linkDataArray since we'll be using a GraphLinksModel,
 * and modelData for demonstration purposes. Note, though, that
 * both are optional props in ReactDiagram.
 */
type DiagramData = {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  selectedData: go.ObjectData | null;
  skipsDiagramUpdate: boolean;
}

function App() {
  // Maps to store key -> arr index for quick lookups
  const [mapNodeKeyIdx, setMapNodeKeyIdx] = useState<Map<go.Key, number>>(new Map<go.Key, number>());
  const [mapLinkKeyIdx, setMapLinkKeyIdx] = useState<Map<go.Key, number>>(new Map<go.Key, number>());

  const [diagram, updateDiagram] = useImmer<DiagramData>({
      nodeDataArray: [
        { key: 0, text: 'Alpha', color: 'lightblue', loc: '0 0' },
        { key: 1, text: 'Beta', color: 'orange', loc: '150 0' },
        { key: 2, text: 'Gamma', color: 'lightgreen', loc: '0 150' },
        { key: 3, text: 'Delta', color: 'pink', loc: '150 150' }
      ],
      linkDataArray: [
        { key: -1, from: 0, to: 1 },
        { key: -2, from: 0, to: 2 },
        { key: -3, from: 1, to: 1 },
        { key: -4, from: 2, to: 3 },
        { key: -5, from: 3, to: 0 }
      ],
      modelData: {
        canRelink: true
      },
      selectedData: null,
      skipsDiagramUpdate: false
    });

    useEffect(() => {
      refreshNodeIndex(diagram.nodeDataArray);
      refreshLinkIndex(diagram.linkDataArray);
    }, []);

    /**
     * Update map of node keys to their index in the array.
     */
    const refreshNodeIndex = (nodeArr: Array<go.ObjectData>) => {
      const newMapNodeKeyIdx: Map<go.Key, number> = new Map<go.Key, number>();
      nodeArr.forEach((n: go.ObjectData, idx: number) => {
        newMapNodeKeyIdx.set(n.key, idx);
      });
      setMapNodeKeyIdx(newMapNodeKeyIdx);
    };

    /**
     * Update map of link keys to their index in the array.
     */
    const refreshLinkIndex = (linkArr: Array<go.ObjectData>) => {
      const newMapLinkKeyIdx: Map<go.Key, number> = new Map<go.Key, number>();
      linkArr.forEach((l: go.ObjectData, idx: number) => {
        newMapLinkKeyIdx.set(l.key, idx);
      });
      setMapLinkKeyIdx(newMapLinkKeyIdx);
    };

  /**
   * Handle any relevant DiagramEvents, in this case just selection changes.
   * On ChangedSelection, find the corresponding data and set the selectedData state.
   * @param e a GoJS DiagramEvent
   */
  const handleDiagramEvent = (e: go.DiagramEvent) => {
    const name = e.name;
    switch (name) {
      case 'ChangedSelection': {
        const sel = e.subject.first();
        updateDiagram((draft: DiagramData) => {
            if (sel) {
              if (sel instanceof go.Node) {
                const idx = mapNodeKeyIdx.get(sel.key);
                if (idx !== undefined && idx >= 0) {
                  const nd = draft.nodeDataArray[idx];
                  draft.selectedData = nd;
                }
              } else if (sel instanceof go.Link) {
                const idx = mapLinkKeyIdx.get(sel.key);
                if (idx !== undefined && idx >= 0) {
                  const ld = draft.linkDataArray[idx];
                  draft.selectedData = ld;
                }
              }
            } else {
              draft.selectedData = null;
            }
          }
        );
        break;
      }
      default: break;
    }
  };

  // Handle selections
  useEffect(() => {
    const selectedData = diagram.selectedData;
    let inspector;
    if (selectedData !== null) {
      inspector = <SelectionInspector
                    selectedData={diagram.selectedData}
                    onInputChange={handleInputChange}
                  />;
    }
  }, [handleInputChange]);

  return (
    <div>
      <p>
        Try moving around nodes, editing text, relinking, undoing (Ctrl-Z), etc. within the diagram
        and you'll notice the changes are reflected in the inspector area. You'll also notice that changes
        made in the inspector are reflected in the diagram. If you use the React dev tools,
        you can inspect the React state and see it updated as changes happen.
      </p>
      <p>
        Check out the <a href='https://gojs.net/latest/intro/react.html' target='_blank' rel='noopener noreferrer'>Intro page on using GoJS with React</a> for more information.
      </p>
      <DiagramWrapper
        nodeDataArray={this.state.nodeDataArray}
        linkDataArray={this.state.linkDataArray}
        modelData={this.state.modelData}
        skipsDiagramUpdate={this.state.skipsDiagramUpdate}
        onDiagramEvent={this.handleDiagramEvent}
        onModelChange={this.handleModelChange}
      />
      <label>
        Allow Relinking?
        <input
          type='checkbox'
          id='relink'
          checked={this.state.modelData.canRelink}
          onChange={this.handleRelinkChange} />
      </label>
      {inspector}
    </div>
  );
};

class App2 extends React.Component<{}, AppState> {





  /**
   * Handle GoJS model changes, which output an object of data changes via Model.toIncrementalData.
   * This method iterates over those changes and updates state to keep in sync with the GoJS model.
   * @param obj a JSON-formatted string
   */
  public handleModelChange(obj: go.IncrementalData) {
    const insertedNodeKeys = obj.insertedNodeKeys;
    const modifiedNodeData = obj.modifiedNodeData;
    const removedNodeKeys = obj.removedNodeKeys;
    const insertedLinkKeys = obj.insertedLinkKeys;
    const modifiedLinkData = obj.modifiedLinkData;
    const removedLinkKeys = obj.removedLinkKeys;
    const modifiedModelData = obj.modelData;

    // maintain maps of modified data so insertions don't need slow lookups
    const modifiedNodeMap = new Map<go.Key, go.ObjectData>();
    const modifiedLinkMap = new Map<go.Key, go.ObjectData>();
    this.setState(
      produce((draft: AppState) => {
        let narr = draft.nodeDataArray;
        if (modifiedNodeData) {
          modifiedNodeData.forEach((nd: go.ObjectData) => {
            modifiedNodeMap.set(nd.key, nd);
            const idx = this.mapNodeKeyIdx.get(nd.key);
            if (idx !== undefined && idx >= 0) {
              narr[idx] = nd;
              if (draft.selectedData && draft.selectedData.key === nd.key) {
                draft.selectedData = nd;
              }
            }
          });
        }
        if (insertedNodeKeys) {
          insertedNodeKeys.forEach((key: go.Key) => {
            const nd = modifiedNodeMap.get(key);
            const idx = this.mapNodeKeyIdx.get(key);
            if (nd && idx === undefined) {  // nodes won't be added if they already exist
              this.mapNodeKeyIdx.set(nd.key, narr.length);
              narr.push(nd);
            }
          });
        }
        if (removedNodeKeys) {
          narr = narr.filter((nd: go.ObjectData) => {
            if (removedNodeKeys.includes(nd.key)) {
              return false;
            }
            return true;
          });
          draft.nodeDataArray = narr;
          this.refreshNodeIndex(narr);
        }

        let larr = draft.linkDataArray;
        if (modifiedLinkData) {
          modifiedLinkData.forEach((ld: go.ObjectData) => {
            modifiedLinkMap.set(ld.key, ld);
            const idx = this.mapLinkKeyIdx.get(ld.key);
            if (idx !== undefined && idx >= 0) {
              larr[idx] = ld;
              if (draft.selectedData && draft.selectedData.key === ld.key) {
                draft.selectedData = ld;
              }
            }
          });
        }
        if (insertedLinkKeys) {
          insertedLinkKeys.forEach((key: go.Key) => {
            const ld = modifiedLinkMap.get(key);
            const idx = this.mapLinkKeyIdx.get(key);
            if (ld && idx === undefined) {  // links won't be added if they already exist
              this.mapLinkKeyIdx.set(ld.key, larr.length);
              larr.push(ld);
            }
          });
        }
        if (removedLinkKeys) {
          larr = larr.filter((ld: go.ObjectData) => {
            if (removedLinkKeys.includes(ld.key)) {
              return false;
            }
            return true;
          });
          draft.linkDataArray = larr;
          this.refreshLinkIndex(larr);
        }
        // handle model data changes, for now just replacing with the supplied object
        if (modifiedModelData) {
          draft.modelData = modifiedModelData;
        }
        draft.skipsDiagramUpdate = true;  // the GoJS model already knows about these updates
      })
    );
  }

  /**
   * Handle inspector changes, and on input field blurs, update node/link data state.
   * @param path the path to the property being modified
   * @param value the new value of that property
   * @param isBlur whether the input event was a blur, indicating the edit is complete
   */
  public handleInputChange(path: string, value: string, isBlur: boolean) {
    this.setState(
      produce((draft: AppState) => {
        const data = draft.selectedData as go.ObjectData;  // only reached if selectedData isn't null
        data[path] = value;
        if (isBlur) {
          const key = data.key;
          if (key < 0) {  // negative keys are links
            const idx = this.mapLinkKeyIdx.get(key);
            if (idx !== undefined && idx >= 0) {
              draft.linkDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          } else {
            const idx = this.mapNodeKeyIdx.get(key);
            if (idx !== undefined && idx >= 0) {
              draft.nodeDataArray[idx] = data;
              draft.skipsDiagramUpdate = false;
            }
          }
        }
      })
    );
  }

  /**
   * Handle changes to the checkbox on whether to allow relinking.
   * @param e a change event from the checkbox
   */
  public handleRelinkChange(e: any) {
    const target = e.target;
    const value = target.checked;
    this.setState({ modelData: { canRelink: value }, skipsDiagramUpdate: false });
  }

  public render() {

    }


  }
}

export default App;
