# GeoChronicle

This is a system for easily using a phone or computer to upload a geolocated photo to create a spatial and temporal database. The database can then be viewed on a map.

The general purpose is to create a journalistic record that allows study or open source intelligence (OSINT).


## Status

This is a fork of geotagtext, a geotagging tutorial app written by Robert L. Read, Diego Aspinwall, and Neil Martis.
Currently the only expected author of this fork is Robert L. Read, although he is seeking volunteers!

As of March 10th, the project allows you to upload multiple photos and automatically extracts geolocation and time information to place markers on a map.
A color scale is used to represent time over the range of all photos uploaded.
Clicking on a marker brings up a photo. The image below was made by walking near Barton Springs in Austin and using an iPhone to take 16 pictures.

![Screen Shot 2022-03-10 at 2 49 43 PM](https://user-images.githubusercontent.com/5296671/157765351-7674ffb8-0fbb-4c3a-9b60-4ad4dd989090.png)

As of right now, the persistence of photos in in the local file system, but the metadata is in firebase. We are going to change this operate on a local install
of MongoDB.


## Basic Idea

The goal of this project is to allow a group of people, perhaps in an emegency situation, to geotag locations
to be on a map. Like all Public Invention projects, it is free-libre open source.

Imagine using your phone to place a red tag on a flooded area, or where a person needs help, and
green tag on a road which is passable.

More generally, the ability to quickly upload a photo and have it reliably placed in time and space
with the "EXIF" data typically embedded by modern phones will allow a GUI that is a valuable journalastic
record of an event.

In particular, this response was made in response to the invasion of the Ukraine by Russia and
the potential need for making a journalistic record of that event.

## New Ideas Based on the March 19th Mini-con

On March 18th, 2022, Public Invention held a  Mini-Con attended by a number of advisors:
1) Christina Cole
1) Prof. Michelle Mellenthin
1) Prof. Warren MacEvoy
1) Harry Pierson
1) Adam Riggs
1) Patrick Coyle
1) Darcy Goff
1) Edwin Chiu

A conversation led by Harry Pierson and Prof. MacEvoy led to the following ideas.

I'm now going to change the way this works. I'm creating a new set
of abstract data types:
*Event*
*EventStore*

These will be represented as JSON, and stored as plane JavaScript
objects in Node.js and the browser. By using local browser storage,
it might even be possible to create a serverless implementation.

An EventStore consists of:
1) a name,
2) a url context guidance field, and
3) a collection Events and EventStores.

An Event constists of:
1) a URL (which may be relative to a context),
2) An upload time
3) An uploader identification record
4) A content hash
5) An overall event hash.

I am not a crypto expert, but the idea is that the overal event hash
gives cryptographic proof of the uploader and the upload time and the
content hash.  When presented with content, one should be able to say
definitively that that content was uploaded at a certain time.

This is valuable because in the case of an alledged event, such as a
war crime, you want to know that content was uploaded soon after the
alledged event. This does not in itself mean that the content is
authentic or even relevant. But if you a set of photos which are
self-corroborating uploaded soon after an event, it is strong
evidence that they are authentic.

The idea is that an EventStore then becuase a transportable
evidentiary object of value when combined with the content.
However, the content, which may be large and expensive, is
separate from the EventStore and can be reunited at a later time.

In particular, an EventStore with thousands of photos can be kept
within browser local storage of 5MB. So for example, a reporter
could collect a 100 geotagged photos with a smartphone, upload
these photos, and export an EventStore. If the EventStore were
then mailed along with the photos to a third party, even if that
transmission occured days or weeks later, it would be proof
positive that the photos were authentically taken at that time.

A complementary function is that an EventStore can be imported
and then a pointer to content provided, and then this code
can provide a data anaylsis tool. That tool can explicitly
check that the content matches the content hash; that is,
that upload time is authentic.

If the uploader identification record contains a cryptographically
strong digital signature, it is proof of the identity of the uploader.
(Note: This signature might have to sign a hash of the content.)

The net effect of all of this is to create a new level of ease
for creating a trustworthy and easy-to-understand record of
content. If that content contians geolocation and temporal data,
then it may be strong evidence of an actual event located
in space and time, such a as a war crime.



## Other Features Needed

1. The ability to enter brief descriptions
2. The ability to tag entries
3. We may need to make an app for a smartphone that can take a picture and send it directly to the database.
4. We need a security model. Although the idea is to provide free and open software as well as functionality, we may need to implement some sort of anti-vandalism features. At a minimum, a user must be free to install a private secure instance.

## Basic Technology

The web page use the geolocation feature now built in to most browsers and accessible via JavaScript.

It uses free and open map technology.

## Usage

This was recently hosted at Heroku. It uses an express server.
I am currently moving away from heroku for this app.

Like most node apps, you will want to run:

> npm install

To pull in all needed libraries.

The fundamenal way to run it without
using heroku and Procifle is to set certain environment variables that contain "secrets":

> export apiKey=
> export authDomain=
> export databaseURL=
> export mapbox_accessToken=
> export messagingSenderId=
> export projectId=
> export storageBucket=

And then run the express server:

> node server.js

The web application with then be running on port :3000.

## Ancient History

Begun by Neil Martis and Rob Read. Improved by Diego Aspinwall.
Written as a [tutorial](https://medium.com/nerd-for-tech/geotagtext-a-tutorial-a-free-geotagging-web-application-composed-of-free-tools-b42bcbcca202), then forked on Feb. 26th, 2022, the 3rd day of the invasion of Ukraine, by Robert L. Read.
