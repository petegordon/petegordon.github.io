const React = require('react')

class Post extends React.Component {
  render () {
    return (
      <div>
        <h1>{this.props.route.page.data.title}</h1>
        <p>I just setup Gatsby and am maybe getting back into the saddle with blogging.  Thats a big maybe.</p>
      </div>
    )
  }
}

export default Post

exports.data = {
  title: "Back in the Saddle",
  date: "2017-03-19T12:00:00.000Z",
}
