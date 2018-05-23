package com.fullapp.yashar.samck.controler

import android.graphics.Color
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import com.fullapp.yashar.samck.R
import com.fullapp.yashar.samck.services.Authservice
import kotlinx.android.synthetic.main.activity_creatuser.*
import java.util.*

class CreatuserActivity : AppCompatActivity() {
    var useravatar = "profiledefault"
    var avatarcolor= "[0.5,.0.5,.0.5,1]"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_creatuser)
    }



fun crate_user_image_click (view: View){
 val random =Random()
    val color =random.nextInt(2)
    val avatar =random.nextInt(28)
    if(color==0){
        useravatar="light$avatar"
    }else{
        useravatar="dark$avatar"
    }
  val resourceid =resources.getIdentifier(useravatar,"drawable",packageName)
    crate_user_img.setImageResource(resourceid)

}
 fun set_bg_btn (view: View) {
     val random=Random()
     val r =random.nextInt(255)
     val g =random.nextInt(255)
     val b =random.nextInt(255)
     crate_user_img.setBackgroundColor(Color.rgb(r,g,b))
     val savedR= r.toDouble() /255
     val savedG= r.toDouble() /255
     val savedB= r.toDouble() /255

     avatarcolor ="[$savedR, $savedB, $savedG, 1]"
    }

fun crate_user_reg_btn (view: View){
   Authservice.registerUser(this,"yashar@gmail.com","09122141469"){complete ->
       if (complete){

       }

   }
}

}
