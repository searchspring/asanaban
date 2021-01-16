const m = require('mithril')
const Asana = require('../model/asana')
const Asanaban = require('../model/asanaban')
module.exports = {
    view(vnode) {
        return (
            <select value={Asanaban.backgroundImage} oninput={(e) => { Asanaban.setBackgroundImage(e.target.value) }}
                class="mt-1 float-right px-4 border-gray-500 text-gray-800 border rounded-full inline-block"
                id="backgroundImages">
                <option value="">no image</option>
                <option value="https://www.influxdata.com/wp-content/uploads/pandas-influxdb.jpg">panda 1</option>
                <option value="https://www.nationalgeographic.com/content/dam/news/2015/12/15/pandas/01pandainsemination.ngsversion.1450209600474.adapt.1900.1.jpg">panda 2</option>
                <option value="https://www.valtech.com/globalassets/15-uk/02-images/04-insights/post-it-notes-1284667_1920.jpg">stickys</option>
                <option value="https://miro.medium.com/max/7000/1*STTTVL5jx050alkYv1iq9w.jpeg">mountain 1</option>
                <option value="https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/moraine-lake-and-the-valley-of-the-ten-peaks-in-the-royalty-free-image-1571062944.jpg">mountain 2</option>
                <option value="https://static.independent.co.uk/s3fs-public/thumbnails/image/2019/08/13/11/istock-1092001144.jpg">mountain 3</option>
                <option value="https://vanaqua.org/application/themes/vanaqua/assets/images/vanaqua-otter.jpg">fat sea weasel</option>
                <option value="https://live.staticflickr.com/4885/45193456835_a7ffb5622e_b.jpg">trash panda</option>
                <option value="https://i.dailymail.co.uk/1s/2020/02/26/22/25245416-0-image-a-18_1582757637588.jpg">red panda</option>
                <option value="https://3er1viui9wo30pkxh1v2nh4w-wpengine.netdna-ssl.com/wp-content/uploads/prod/sites/45/2019/11/MS_Penguin-Counting-Story_1900x800.jpg">penguins</option>
                <option value="https://i.imgur.com/egWdlP2.jpg">penguins 2</option>
                <option value="https://ogden_images.s3.amazonaws.com/www.ironmountaindailynews.com/images/2020/03/24112829/Hedgehog3-1100x733.jpg">hedgehog</option>
                <option value="https://www.nydailynews.com/resizer/46J__P5il8SBpVzanAgyALO-Hmk=/1200x0/top/arc-anglerfish-arc2-prod-tronc.s3.amazonaws.com/public/O4TVS77I2W4OWA2UCLZP34EM4Q.jpg">bunny</option>
            </select>
        )
    }
}