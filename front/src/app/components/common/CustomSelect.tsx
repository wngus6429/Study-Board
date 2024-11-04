import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { ReactNode, useState } from "react";
import { WRITE_SELECT_OPTION_TYPE } from "@/app/const/WRITE_CONST";

interface CustomSelectProps {
  selectArray: { name: string; value: string }[];
  defaultValue?: WRITE_SELECT_OPTION_TYPE;
  setSelectedCategory: (value: string) => void;
}

const CustomSelect = ({ selectArray, defaultValue, setSelectedCategory }: CustomSelectProps): ReactNode => {
  const defaultItem = selectArray.find((item) => item.name === defaultValue);
  const [selectedValue, setSelectedValue] = useState<string>(defaultItem?.value || "");
  const [open, setOpen] = useState(false);

  const handleChange = (event: SelectChangeEvent<typeof selectedValue>) => {
    setSelectedValue(event.target.value);
    setSelectedCategory(event.target.value);
  };

  return (
    <FormControl sx={{ m: 1, width: "100%", margin: 0, marginBottom: 3 }}>
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
        MenuProps={{
          disableScrollLock: true,
        }}
      >
        {selectArray.map((select, index) => (
          <MenuItem key={index} value={select.value}>
            {select.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CustomSelect;
