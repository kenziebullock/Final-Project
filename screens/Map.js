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
        price: null,
        owner: null,
        image: null
      },
      spotRented: null,
      currentOrder: null,
      rentedSpotInfo: {
        price: null,
        info: [],
      },
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
        address: data.title,
        owner: data.owner,
        image: data.image
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
        address: this.state.spotInfo.address,
        spot: this.state.spotInfo.id,
        owner: this.state.spotInfo.owner,
        start: Date.now(),
        renter: firebase.auth().currentUser.uid
      })
      .then(data => {
        this.setState({currentOrder: data.key}, () => {
          this.parkingConfirmComplete();
        });
        //success callback
        console.log("data ", data);
      })
      .catch(error => {
        //error callback
        console.log("error ", error);
      });
  }

  parkButtonPressed() {
    let userId = firebase.auth().currentUser.uid;
    firebase.database().ref(`/users/${userId}`).once('value', (user) => {
      console.log(user);
      if (!user.val().stripe_id) {
        alert('Please add a credit card to your account to rent a spot');
        return;
      }
      if (user.val().currently_renting) {
        alert('Sorry, you are already renting a spot.');
        return;
      }
      this.infoPopup.dismiss(() => {
        setTimeout(() => {
          this.confirmPopup.show();
        }, 200);
      });
    });
  }

  parkingConfirmComplete() {
    let currentUser = firebase.auth().currentUser;
    if (this._isMounted) {
      this.confirmPopup.dismiss();
      firebase.database().ref(`spots/${this.state.spotInfo.id}/is_rented`).set(true);
      firebase.database().ref(`/users/${currentUser.uid}/currently_renting`).set(this.state.spotInfo.id);
      firebase.database().ref(`/users/${currentUser.uid}/current_order`).set(this.state.currentOrder);
    }
  }

  statusPressed() {
    console.log("status pressed");
    this.statusPopup.show();
  }

  checkout() {
    let currentUser = firebase.auth().currentUser;
    this.statusPopup.dismiss();
    firebase.database().ref(`spots/${this.state.spotRented}/is_rented`).set(false);
    firebase.database().ref(`/users/${currentUser.uid}/currently_renting`).set(null);
    firebase.database().ref(`/users/${currentUser.uid}/current_order`).set(null);
  }

  componentDidMount() {
    this._isMounted = true;

    // console.log('did mount', this._isMounted);
    if (this._isMounted) {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          firebase.database().ref(`/users/${user.uid}`).on('value', (data) => {
            let renting = data.val().currently_renting;
            let order = data.val().current_order;
            this.setState({
              spotRented: renting,
              currentOrder: order,
            });
            if (renting) {
              firebase.database().ref(`/spots/${renting}`).once('value', (spot) => {
                console.log(spot);
                let price = spot.val().price;
                let info = [spot.val().title, spot.val().description];
                this.setState({
                  rentedSpotInfo: {
                    price: price,
                    info: info,
                  }
                })
              });
            }
          });
        }
      })
      firebase.database().ref("/spots/").on("value", (data) => {
        let spots = [];
        data.forEach((childSnapshot) => {
          storageRef = firebase.storage().ref()
          var starsRef = storageRef.child(`lot_images/${childSnapshot.val().owner}/${childSnapshot.key}/lot.jpg`);
          
          starsRef.getDownloadURL().then((url) =>{
            console.log("URL : " , url)
            let item = childSnapshot.val();
            item.id = childSnapshot.key;
            item.image = url;
            spots.push(item);
            this.setState({
              markers: spots
            });
          });
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
                parkingConfirmComplete={this.writeOrderData}
              />
            </PopupDialog>
            <PopupDialog
              ref={statusPopup => {
                this.statusPopup = statusPopup;
              }}
              dialogAnimation={slideAnimation}
              dialogStyle={styles.statusDialog}
            >
              <StatusCard 
                info={this.state.rentedSpotInfo}
                id={this.state.currentOrder} 
                checkout={this.checkout}
              />
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
    height: "50%"
  },
  statusDialog: {},
  currentRental: {
    position: "absolute",
    bottom: "10%"
  }
});
