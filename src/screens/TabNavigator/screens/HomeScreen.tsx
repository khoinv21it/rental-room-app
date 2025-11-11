import { View, Text } from 'react-native'
import React from 'react'

type Props = {
  navigation: any;
};

const HomeScreen = ({ navigation }: Props) => {
  return (
    <View>
      <Text>HomeScreen</Text>
    </View>
  )
}

export default HomeScreen