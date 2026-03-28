import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Theme';
import { Body1, Body2 } from '../ui/Typography';

export const TransferTimeline = ({ timelineEvents = [] }) => {
  if (!timelineEvents.length) {
    return (
      <View style={styles.emptyContainer}>
        <Body1>No timeline history available.</Body1>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {timelineEvents.map((event, index) => {
        const isLast = index === timelineEvents.length - 1;
        return (
          <View key={index} style={styles.eventRow}>
            <View style={styles.timelineColumn}>
              <View style={[styles.node, isLast ? styles.nodeCurrent : {}]} />
              {!isLast && <View style={styles.line} />}
            </View>
            <View style={styles.contentColumn}>
              <Body1 style={styles.location}>{event.location}</Body1>
              <Body2>{event.timestamp}</Body2>
              {event.note && <Body2 style={styles.note}>{event.note}</Body2>}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 30,
    marginRight: 16,
  },
  node: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  nodeCurrent: {
    backgroundColor: Colors.secondary,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: -2,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 24,
  },
  location: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  note: {
    marginTop: 4,
    fontStyle: 'italic',
  }
});
