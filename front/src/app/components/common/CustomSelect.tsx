import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { ReactNode, useState } from "react";
import { WRITE_SELECT_OPTION_TYPE } from "@/app/const/writeconsts";

interface CustomeSelectProps {
  selectArray: { name: string; value: string }[];
  defaultValue?: WRITE_SELECT_OPTION_TYPE;
}

const CustomSelect = ({ selectArray, defaultValue }: CustomeSelectProps): ReactNode => {
  const defaultItem = selectArray.find((item) => item.name === defaultValue);
  const [selectedValue, setSelectedValue] = useState<string>(defaultItem?.value || "");
  const [open, setOpen] = useState(false);

  const handleChange = (event: SelectChangeEvent<typeof selectedValue>) => {
    setSelectedValue(event.target.value);
  };

  return (
    <div>
      <FormControl sx={{ m: 1, minWidth: 120, margin: 0, marginBottom: 3 }}>
        <InputLabel id="demo-controlled-open-select-label">종류</InputLabel>
        <Select
          labelId="demo-controlled-open-select-label"
          id="demo-controlled-open-select"
          open={open}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          value={selectedValue}
          label="글 종류"
          onChange={handleChange}
        >
          {selectArray.map((select, index) => (
            <MenuItem key={index} value={select.value}>
              {select.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default CustomSelect;
