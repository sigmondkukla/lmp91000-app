import * as React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";

interface ChronoamperometryParamsProps {
  onChanged: (values: { initE: string; quietTime: string; e1: string; duration1: string; e2: string; duration2: string; e3: string; duration3: string; finalE: string }) => void;
}

const ChronoamperometryParams: React.FC<ChronoamperometryParamsProps> = ({ onChanged }) => {
  const [initE, setInitE] = React.useState("200");          // to 4 byte int32
  const [quietTime, setQuietTime] = React.useState("100");  // to 4 byte uint32
  const [e1, setE1] = React.useState("200");                // to 4 byte int32
  const [duration1, setDuration1] = React.useState("1000"); // to 4 byte uint32
  const [e2, setE2] = React.useState("-200");               // to 4 byte int32
  const [duration2, setDuration2] = React.useState("1000"); // to 4 byte uint32
  const [e3, setE3] = React.useState("200");                // to 4 byte int32
  const [duration3, setDuration3] = React.useState("1000"); // to 4 byte uint32
  const [finalE, setFinalE] = React.useState("0");          // to 4 byte int32

  React.useEffect(() => {
    onChanged({ initE, quietTime, e1, duration1, e2, duration2, e3, duration3, finalE });
  }, [initE, quietTime, e1, duration1, e2, duration2, e3, duration3, finalE, onChanged]);
  const checkVoltageValid = (input: string) => {
    return (
      input !== "" &&
      !isNaN(Number(input)) &&
      Number(input) >= -3300 &&
      Number(input) <= 3300 &&
      Number(input) % 1 === 0
    );
  };
  const checkDurationValid = (input: string) => {
    return (
      input !== "" &&
      !isNaN(Number(input)) &&
      Number(input) >= 0 &&
      Number(input) % 1 === 0
    );
  };

  const styles = StyleSheet.create({
    textInputGroup: {
      display: "flex",
      flexDirection: "row",
      //   gap: 8,
      //   flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: 8,
    },
    textInput: {
      width: "32%",
    },
  });

  return (
    <View>
      <View style={styles.textInputGroup}>
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Init E"
          value={initE}
          onChangeText={(initE) => setInitE(initE)}
          error={!checkVoltageValid(initE)}
          right={<TextInput.Affix text="mV" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Quiet Time"
          value={quietTime}
          onChangeText={(quietTime) => setQuietTime(quietTime)}
          error={!checkDurationValid(quietTime)}
          right={<TextInput.Affix text="ms" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Final E"
          value={finalE}
          onChangeText={(finalE) => setFinalE(finalE)}
          error={!checkVoltageValid(finalE)}
          right={<TextInput.Affix text="mV" />}
        />
      </View>
      <View style={styles.textInputGroup}>
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="E1"
          value={e1}
          onChangeText={(e1) => setE1(e1)}
          error={!checkVoltageValid(e1)}
          right={<TextInput.Affix text="mV" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="E2"
          value={e2}
          onChangeText={(e2) => setE2(e2)}
          error={!checkVoltageValid(e2)}
          right={<TextInput.Affix text="mV" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="E3"
          value={e3}
          onChangeText={(e3) => setE3(e3)}
          error={!checkVoltageValid(e3)}
          right={<TextInput.Affix text="mV" />}
        />
      </View>
      <View style={styles.textInputGroup}>
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Duration 1"
          value={duration1}
          onChangeText={(duration1) => setDuration1(duration1)}
          error={!checkDurationValid(duration1)}
          right={<TextInput.Affix text="ms" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Duration 2"
          value={duration2}
          onChangeText={(duration2) => setDuration2(duration2)}
          error={!checkDurationValid(duration2)}
          right={<TextInput.Affix text="ms" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Duration 3"
          value={duration3}
          onChangeText={(duration3) => setDuration3(duration3)}
          error={!checkDurationValid(duration3)}
          right={<TextInput.Affix text="ms" />}
        />
      </View>
    </View>
  );
};

export default ChronoamperometryParams;
