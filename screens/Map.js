import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  TouchableHighlight
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import PopupDialog, { SlideAnimation } from "react-native-popup-dialog";
import InfoCard from "../Components/InfoCard";
import ConfirmCard from "../Components/ConfirmCard";
import StatusCard from "../Components/StatusCard";
import CurrentRental from "../Components/CurrentRental";
import HeaderNavigation from "../Components/HeaderNavigation.js";
import { Container } from "native-base";

import firebase from "../Firebase.js";

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: null,
      markers: [],
      parkPressed: false,
      spotInfo: {
        price: 1.25,
        info: ["Plug available", "12345 12 Street"],
        is_rented: null,
        id: null,
        price: null
      },
      spotRented: false,
      userId: null,
    };
    this.markerPressed = this.markerPressed.bind(this);
    this.parkButtonPressed = this.parkButtonPressed.bind(this);
    this.parkingConfirmComplete = this.parkingConfirmComplete.bind(this);
    this.statusPressed = this.statusPressed.bind(this);
    this.writeOrderData = this.writeOrderData.bind(this);
    this.checkout = this.checkout.bind(this);
  }

  _isMounted = false;

  _onMapReady = () => {
    console.log("map ready");
  };

  markerPressed(data) {
    console.log(data);
    this.setState({
      spotInfo: {
        price: data.price,
        info: [data.title, data.description],
        is_rented: data.is_rented,
        id: data.id,
        price: data.price
      }
    },
    function() {
      console.log('show popup')
      this.infoPopup.show();
    });
  }

  writeOrderData() {
    firebase
      .database()
      .ref("orders/")
      .push({
        address: "123 fake street",
        start: Date.now()
      })
      .then(data => {
        this.setState({ id: data.key });
        //success callback
        console.log("data ", data);
      })
      .catch(error => {
        //error callback
        console.log("error ", error);
      });
  }

  parkButtonPressed() {
    console.log("park pressed");
    this.infoPopup.dismiss(() => {
      setTimeout(() => {
        this.confirmPopup.show();
      }, 200);
    });
  }

  parkingConfirmComplete() {
    let currentUser = firebase.auth().currentUser;
    if (this._isMounted) {
      console.log(`SPOT #${this.state.spotInfo.id} RENTED`);
      this.writeOrderData();
      this.confirmPopup.dismiss();
      this.setState({
        spotRented: true
      });
      firebase.database().ref(`spots/${this.state.spotInfo.id}/is_rented`).set(true);
      firebase.database().ref(`/users/${currentUser.uid}/currently_renting`).set(true);
    }
  }

  statusPressed() {
    console.log("status pressed");
    this.statusPopup.show();
  }

  checkout() {
    let currentUser = firebase.auth().currentUser;
    this.statusPopup.dismiss();
    firebase.database().ref(`spots/${this.state.spotInfo.id}/is_rented`).set(false);
    firebase.database().ref(`/users/${currentUser.uid}/currently_renting`).set(false);
    this.setState({
      spotRented: false
    });
  }

  componentDidMount() {
    this._isMounted = true;

    // console.log('did mount', this._isMounted);
    if (this._isMounted) {
      firebase
        .database()
        .ref("/spots/")
        .on("value", (data) => {
          let spots = [];
          data.forEach(function(childSnapshot) {
            let item = childSnapshot.val();
            item.id = childSnapshot.key;
            spots.push(item);
          });
          this.setState({
            markers: spots
          });
        });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    // console.log('unmount', this._isMounted);
    firebase.database().ref.off();
  }

  render() {
    const slideAnimation = new SlideAnimation({
      slideFrom: "top"
    });

    return (
      <Container>
        <HeaderNavigation navigation={this.props.navigation} />
        <View style={{ width: "100%", height: "100%", alignItems: "center" }}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 51.0478,
              longitude: -114.0593,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1
            }}
            showsUserLocation={true}
            onPress={this.removeCard}
          >
            {this.state.markers.map(marker => {
              return (
                <Marker
                  key={marker.id}
                  coordinate={{
                    latitude: marker.location.lat,
                    longitude: marker.location.lng
                  }}
                  onPress={() => this.markerPressed(marker)}
                  image={marker.is_rented ? require('../assets/GrayMarker.png') : require('../assets/GreenMarker.png')}
                />
              );
            })}
          </MapView>

          <View style={styles.currentRental}>
            {this.state.spotRented && (
              <TouchableHighlight onPress={this.statusPressed}>
                <CurrentRental />
              </TouchableHighlight>
            )}
          </View>

          <View style={styles.popupContainer}>
            <PopupDialog
              ref={infoPopup => {
                this.infoPopup = infoPopup;
              }}
              dialogAnimation={slideAnimation}
              dialogStyle={styles.dialog}
            >
              <InfoCard
                info={this.state.spotInfo}
                parkButtonPressed={this.parkButtonPressed}
              />
            </PopupDialog>
            <PopupDialog
              ref={confirmPopup => {
                this.confirmPopup = confirmPopup;
              }}
              dialogAnimation={slideAnimation}
              dialogStyle={styles.dialog}
            >
              <ConfirmCard
                info={this.state.spotInfo}
                parkingConfirmComplete={this.parkingConfirmComplete}
              />
            </PopupDialog>
            <PopupDialog
              ref={statusPopup => {
                this.statusPopup = statusPopup;
              }}
              dialogAnimation={slideAnimation}
              dialogStyle={styles.statusDialog}
            >
              <StatusCard info={this.state.spotInfo} id={this.state.id} checkout={this.checkout} parkedTime={this.state.parkedTime}/>
            </PopupDialog>
          </View>
        </View>
      </Container>
    );
  }
}

export default Map;

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject
  },
  popupContainer: {
    height: "100%",
    width: "100%"
  },
  dialog: {
    position: "absolute",
    top: "4%",
    width: "90%",
    height: "38%"
  },
  statusDialog: {},
  currentRental: {
    position: "absolute",
    bottom: "10%"
  }
});
