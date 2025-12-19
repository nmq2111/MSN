# MSN-BAHRAIN

- MSN Bahrain is an online advertising platform created to help users sell their products and facilitate connections between sellers and buyers. 
---
## Trello Documentation
[Trello](https://trello.com/invite/b/682467cc76713d02ef11fa3f/ATTIc093db85297ab01652d70dd45ba8160c07C0957D/my-trello-board)
---
## Features

### Current Features

- Guests are able to navigate through the different categories & view the published ads.
- Adding to that, *seller* can publish ads, edit & delete their ow ads.
- In each user profile, the user is able to edit his details, upload his picture & change his password.

### Future Features
- We'll add the logistics users.
- Different users authorities, as the seller will be able to assign a sell to a logistic user to deliever the product once purchased.
- Adding an "Inspection request" where the buyer can send to the ad owner.

---
## The Scenarios

- Guest enters the website & search for specific product
- Guest enters & view all the posted ads
- User can create new ads
- User can edit their own ads
- User can delete their own ads

---

## Main Functionality

- Sign up
- Sing in
- sing out
- Show all (Landing page)
- Search by keyword
- User Dashboard (User landing page)
- Creating Ad
- Edit & Update Add
- Delete Ad

---

## Entities

- Users
- Ads

---

## Entity Relationship Diagram

- Users

  - UserID
  - name
  - password
  - category
  - ContactNo
  - Email

- Ads

  - AdsID
  - Title
  - Price
  - Description
  - Condition
  - Category
  - UserID
  - Date
