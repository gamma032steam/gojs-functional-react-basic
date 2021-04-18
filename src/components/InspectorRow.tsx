/*
*  Copyright (C) 1998-2021 by Northwoods Software Corporation. All Rights Reserved.
*/

import {useEffect, useState, useCallback} from 'react';
import './Inspector.css';

interface InspectorRowProps {
  id: string;
  value: string;
  onInputChange: (key: string, value: string, isBlur: boolean) => void;
}

export function InspectorRow(props: InspectorRowProps) {
  const [val, setVal] = useState<string>(props.value);

  const handleInputChange = (e: any) => {
    props.onInputChange(props.id, e.target.value, e.type === 'blur');
  };

  const formatLocation = useCallback((loc: string): string => {
    const locArr = loc.split(' ');
    if (locArr.length === 2) {
      const x = parseFloat(locArr[0]);
      const y = parseFloat(locArr[1]);
      if (!isNaN(x) && !isNaN(y)) {
        return `${x.toFixed(0)} ${y.toFixed(0)}`;
      }
    }
    return loc;
  }, []);

  useEffect(() => {
    if (props.id === 'loc') {
      setVal(formatLocation(props.value));
    }
  }, [props.id, props.value, setVal, formatLocation]);
  
  return (
    <tr>
      <td>{props.id}</td>
      <td>
        <input
          disabled={props.id === 'key'}
          value={val}
          onChange={handleInputChange}
          onBlur={handleInputChange}>
        </input>
      </td>
    </tr>
  );
};