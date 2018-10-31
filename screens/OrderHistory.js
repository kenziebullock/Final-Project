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
import { StyleSheet } from "react-native";
import ScreenHeader from "../Components/ScreenHeader";

import firebase from "../Firebase";

export default class OrderHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: []
    };
    firebase;
  }

  orderTotal(duration, price) {
    return (duration / 60) * price;
  }

  componentDidMount() {
    let uid = firebase.auth().currentUser.uid;

    firebase
      .database()
      .ref("/orders/")
      .on("value", data => {
        let orders = [];
        data.forEach(order => {
          // finds data for user
          if (uid === order.val().renter) {
            let newOrder = order.val();
            newOrder.key = order.key;
            orders.push(newOrder);
          }
        });
        this.setState({ orders: orders });
      });
  }

  render() {
    let id = 0;
    let orderHistory = this.state.orders.map(order => {
      id++;
      return (
        <Card key={order.key}>
          <CardItem style={styles.card} header bordered>
            <Text style={styles.header}>Order # {id}</Text>
          </CardItem>
          <CardItem style={styles.card} bordered>
            <Body>
              <Text style={styles.body}>
                Address: {order.address}
                {"\n"}
                Duration: {order.duration}
              </Text>
            </Body>
          </CardItem>
          <CardItem style={styles.card} footer bordered>
            <Text style={styles.footer}>
              Total: ${order.totalPayed / 100.0}
            </Text>
          </CardItem>
        </Card>
      );
    });

    return (
      <Container style={styles.container}>
        <ScreenHeader navigation={this.props.navigation} />
        <Content padder>{orderHistory}</Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
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
  footer: {
    color: "#3c3c3c",
    fontFamily: "sans-serif-thin"
  }
});
