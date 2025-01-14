import { Profile } from "../models/profile.js" ;
import { Post } from "../models/post.js" ;
import { v2 as cloudinary } from 'cloudinary'


async function index(req, res) {
  try {
    const posts = await Post.find({})
      .populate('author')
      .populate({path: 'comments', populate: {path: 'author'}})
      .sort({createdAt: 'desc'})
    res.status(200).json(posts)
  } catch (error) {
    res.status(500).json(error)
  }
}

async function create(req, res) {
  try {
    req.body.author = req.user.profile
    const post = await Post.create(req.body)
    const profile = await Profile.findByIdAndUpdate(
      req.user.profile,
      { $push: { posts: post } },
      { new: true }
    )
    post.author = profile
    res.status(201).json(post)
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
}

async function createComment(req, res) {
  try {
    req.body.author = req.user.profile
    const post = await Post.findById(req.params.id)
    post.comments.push(req.body)
    await post.save()
    await post.populate({path: 'comments', populate: {path: 'author'}})
    res.status(201).json(post)
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
}

async function deletePost(req, res) {
  try {
    const post = await Post.findById(req.params.id)
    if (post.author.equals(req.user.profile)) {
      await Post.findByIdAndDelete(req.params.id)
      const profile = await Profile.findById(req.user.profile)
      profile.posts.remove({_id: req.params.id})
      await profile.save()
      res.status(200).json(post)
    } else {
      throw new Error('Not Authorized')
    }
  } catch (error) {
    res.status(500).json(error)
  }
}

async function updatePost(req, res) {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true }
    ).populate('author')
    res.status(200).json(post)
  } catch (error) {
    res.status(500).json(error)
  }
}

function addPhoto(req, res) {
  const imageFile = req.files.photo.path

  Profile.findById(req.params.id)
  .then(profile =>  {

    const postObjId = profile.posts[profile.posts.length - 1].toString()
    
    cloudinary.uploader.upload(imageFile, {tags: `${req.user.email}`})
    .then(image => {
      Post.findById(postObjId)
      .then(post=>{
        console.log('hey', image.url)
        post.photo = image.url
        post.save()

      })
        .then(profile => {
          res.status(201).json(profile)
        })
    })
    .catch(err => {
      console.log(err)
      res.status(500).json(err)
    })
  })
}


async function showPost(req,res){
  try{
    const post = await Post.findById(req.params.id)
    .populate({path: 'comments', populate: {path: 'author'}})
    res.status(200).json(post)
  }catch(error){
    res.status(500).json(error)
  }
}
export {
  index,
  create,
  createComment,
  deletePost as delete,
  updatePost as update,
  addPhoto,
  showPost
}