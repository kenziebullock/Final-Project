import React from "react";
import {
  Container,
  Header,
  Content,
  Card,
  CardItem,
  Text,
  Body
} from "native-base";
import {
  Image,
  StyleSheet,
  Button,
  View,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import ScreenHeader from "../Components/ScreenHeader";

import firebase from "../Firebase.js";

export default class MySpots extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      spots: [],
      renderedSpots: [],
      image_url: null
    };
    firebase;
    storageRef = firebase.storage().ref();
    this.test_image_url = null;
    this.counter = 0;
    this.receivedUpdate = this.receivedUpdate.bind(this);
  }

  receivedUpdate = foo => {
    console.log("in the received update");
    this.setState({ foo });
  };

  componentDidMount() {
    let user_id = firebase.auth().currentUser.uid;

    firebase
      .database()
      .ref("/spots/")
      .on("value", data => {
        let spots = [];
        data.forEach(spot => {
          if (user_id === spot.val().owner) {
            let newSpot = spot.val();
            newSpot.key = spot.key;
            spots.push(newSpot);
          }
        });
        // ?????
        this.setState({ spots: spots });
      });
  }

  componentWillUnmount() {
    // firebase.database().ref.off();
  }

  render() {
    self = this;
    let id = 0;
    let mySpots = this.state.spots.map(spot => {
      if (spot.picture_url) {
        var lotImageRef = storageRef.child(
          `lot_images/${firebase.auth().currentUser.uid}/${spot.key}/lot.jpg`
        );
      } else {
        var lotImageRef = storageRef.child(`no_imagev2.png`);
      }
      lotImageRef.getDownloadURL().then(url => {
        self.test_image_url = url;
        self.counter += 1;
        id++;
        cardToPush = (
          <Card key={spot.key}>
            <CardItem style={styles.card} header bordered>
              <Text style={styles.header}>Spot: {id}</Text>
            </CardItem>
            <CardItem style={styles.card} bordered>
              {self.test_image_url ? (
                <Image
                  style={styles.picture}
                  source={{ uri: self.test_image_url }}
                />
              ) : (
                <Image
                  style={styles.picture}
                  source={require("../assets/spot.jpg")}
                />
              )}
            </CardItem>
            <CardItem style={styles.card} bordered>
              <Body>
                <Text style={styles.body}>
                  Address: {spot.title}
                  {"\n"}
                  Description: {spot.description}
                </Text>
              </Body>
            </CardItem>
            <CardItem style={styles.card} footer bordered>
              <Text style={styles.body}>
                Price: ${spot.price}
                /hr
              </Text>
            </CardItem>

            <Button
              //style={styles.button}
              disabled={spot.is_rented}
              onPress={() =>
                self.props.navigation.navigate("EditSpot", {
                  spot,
                  onNavigateBack: this.receivedUpdate
                })
              }
              title="Edit Spot"
              color="#2f2f2f"
              accessibilityLabel="Edit Parking Spot"
            />
          </Card>
        );
        if (self.counter <= self.state.spots.length) {
          self.setState(prevState => ({
            renderedSpots: [...prevState.renderedSpots, cardToPush]
          }));
        }
      });
    });

    return (
      <Container style={styles.container}>
        <ScreenHeader navigation={this.props.navigation} />
        <Content padder>{this.state.renderedSpots}</Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  picture: {
    flexDirection: "column",
    width: 128,
    height: 128,
    justifyContent: "flex-end"
  },
  container: {
    backgroundColor: "#3c3c3c"
  },
  card: {
    backgroundColor: "#8a8a8a"
  },
  header: {
    color: "#3c3c3c",
    fontFamily: "sans-serif-thin"
  },
  body: {
    color: "#FFFFFF",
    fontFamily: "sans-serif-thin"
  },
  button: {
    backgroundColor: "#2f2f2f",
    fontFamily: "sans-serif-thin"
  }
});
