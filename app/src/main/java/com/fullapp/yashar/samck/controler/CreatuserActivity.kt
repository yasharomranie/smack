package com.fullapp.yashar.samck.controler

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.provider.ContactsContract
import android.support.v4.content.LocalBroadcastManager
import android.view.View
import android.widget.Toast
import com.fullapp.yashar.samck.R
import com.fullapp.yashar.samck.Utilitis.BROADCAST_USER_DATA_CHANGE
import com.fullapp.yashar.samck.services.Authservice
import com.fullapp.yashar.samck.services.Userservise
import kotlinx.android.synthetic.main.activity_creatuser.*
import java.util.*

class CreatuserActivity : AppCompatActivity() {
    var useravatar = "profiledefault"
    var avatarcolor= "[0.5,.0.5,.0.5,1]"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_creatuser)
        createProgress.visibility=View.INVISIBLE
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
    enableprograss(true)
    val username = crate_user_username.text.toString()
    val useremail =crate_use_email.text.toString()
    val userpassword =crate_user_password.text.toString()

    if (username.isNotEmpty() && useremail.isNotEmpty() && userpassword.isNotEmpty()){
        Authservice.registerUser(this,useremail ,userpassword ){registersucess ->
            if (registersucess){
                Authservice.login_user(this,useremail,userpassword){loginsucsess ->
                    if(loginsucsess){

                        Authservice.createUser(this,useremail,username,useravatar,avatarcolor){cratesucess->
                            if (cratesucess){

                                val user_data_change =Intent(BROADCAST_USER_DATA_CHANGE)
                                LocalBroadcastManager.getInstance(this).sendBroadcast(user_data_change )
                                println(Userservise.avatarColor)
                                println(Userservise.avatarName)
                                println(Userservise.email)
                                enableprograss(false)
                                finish()
                            }else{
                                erortoast()

                            }

                        }
                    }else{
                        erortoast()

                    }
                }
            }else{
                erortoast()
            }



        }


    }else{
        Toast.makeText(this,"لطفا تمامی فیلدهای یوزرنیم و ایمیل و پسورد را وارد کنید",Toast.LENGTH_LONG).show()
        enableprograss(false)
    }


}

    fun erortoast(){
        Toast.makeText(this,"به نظر میرسد در اجرای فرانید مشکل پیش آماده لطفا مجدا تلاش کنید",Toast.LENGTH_LONG).show()
        enableprograss(false)
    }

    fun enableprograss(enable:Boolean){
        if (enable){
          createProgress.visibility=View.VISIBLE
        }else{
          createProgress.visibility=View.INVISIBLE
        }
        crate_user_img.isEnabled=!enable
        crate_user_bg_btn.isEnabled=!enable
        crate_user_reg_btn.isEnabled=!enable
    }

}
