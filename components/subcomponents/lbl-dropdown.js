import { Fragment } from "react";

function LblDropdown(props) {
  return (
    <Fragment>
      <option value="default" disabled>
        -- select an option --
      </option>
      {props.labels.map((lbl, idx) => (
        <option value={idx} key={idx}>{lbl}</option>
      ))}
    </Fragment>
  );
}

export default LblDropdown;
