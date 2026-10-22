import { Component, type ReactNode } from "react";
import { View } from "react-native";

import { ScreenState } from "@/components/ui/ScreenState";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <View style={{ flex: 1, backgroundColor: "#07080A", justifyContent: "center" }}>
          <ScreenState
            kind="error"
            title="The map did not open"
            body="The ride is still simulating underneath. Try the map again, or continue from Trips and Alerts."
            actionLabel="Try again"
            onAction={() => this.setState({ failed: false })}
          />
        </View>
      );
    }
    return this.props.children;
  }
}
