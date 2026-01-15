// Debugging Contact Messages Issue
// Run this in MongoDB shell or add as a temporary route to check data

// 1. Check if there are any contacts in the database
db.contacts.find().pretty()

// 2. Check if contacts have storeBranch field
db.contacts.find({}, { name: 1, email: 1, storeBranch: 1, status: 1 }).pretty()

// 3. Check if there are contacts without storeBranch (old data)
db.contacts.find({ storeBranch: { $exists: false } }).count()

// 4. If you have old contacts without storeBranch, update them:
// First, get a valid branch ID:
db.storebranches.findOne({}, { _id: 1 })

// Then update old contacts with a branch (replace BRANCH_ID with actual ID):
// db.contacts.updateMany(
//   { storeBranch: { $exists: false } },
//   { $set: { storeBranch: ObjectId("BRANCH_ID") } }
// )

// 5. Verify the update
db.contacts.find({}, { name: 1, storeBranch: 1 }).pretty()
